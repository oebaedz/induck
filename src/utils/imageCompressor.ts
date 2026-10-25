/**
 * Utility to compress and resize student photo uploads
 * Automatically resizes image to standard 3x4 pas foto proportions (max 360x480px)
 * and compresses as JPEG.
 * This keeps the base64 string to ~15KB - 25KB, well below browser memory limits
 * and safely below Google Sheets' 50,000 character cell limit.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 360,
  maxHeight = 480,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar valid.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung atau korup.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth x maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas 2D context unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Fill background with white for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw and scale image
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
