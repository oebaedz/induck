/**
 * Google Drive Photo Storage Service
 * Uploads student photos to Google Drive so they are accessible from any device.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export const DRIVE_FOLDER_NAME = 'Buku Induk - Foto Siswa';

export function isOnlineUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Searches or creates a dedicated folder in Google Drive for school photos
 */
export async function getOrCreateDriveFolder(
  accessToken: string,
  folderName: string = DRIVE_FOLDER_NAME
): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
  const searchUrl = `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive');
  }

  const folderData = await createRes.json();
  const folderId = folderData.id;

  // Make folder contents shareable
  try {
    await fetch(`${DRIVE_API_BASE}/files/${folderId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public folder permissions, file permissions will be set per item', permErr);
  }

  return folderId;
}

/**
 * Uploads a base64 or binary image to Google Drive, sets public reader permission,
 * and returns the direct permanent online URL.
 */
export async function uploadPhotoToGoogleDrive(
  accessToken: string,
  dataUrlOrBlob: string | Blob,
  fileName: string,
  folderId?: string
): Promise<{ fileId: string; directUrl: string }> {
  // If already an online URL, no need to upload
  if (typeof dataUrlOrBlob === 'string' && isOnlineUrl(dataUrlOrBlob)) {
    return { fileId: '', directUrl: dataUrlOrBlob };
  }

  let blob: Blob;
  let mimeType = 'image/jpeg';

  if (typeof dataUrlOrBlob === 'string') {
    // Parse data URL
    if (dataUrlOrBlob.startsWith('data:')) {
      const parts = dataUrlOrBlob.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      const binary = atob(parts[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      blob = new Blob([array], { type: mimeType });
    } else {
      throw new Error('Format data gambar tidak valid untuk diunggah.');
    }
  } else {
    blob = dataUrlOrBlob;
    mimeType = blob.type || 'image/jpeg';
  }

  // 1. Create file metadata
  const metadata = {
    name: fileName.endsWith('.jpg') || fileName.endsWith('.png') ? fileName : `${fileName}.jpg`,
    parents: folderId ? [folderId] : undefined,
  };

  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat file foto di Google Drive');
  }

  const fileData = await createRes.json();
  const fileId = fileData.id;

  // 2. Upload media binary via PATCH
  const uploadRes = await fetch(`${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal mengunggah biner foto ke Google Drive');
  }

  // 3. Set permission to anyone reader so it can be loaded on any device
  await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  }).catch(() => {
    // Non-fatal if domain policies restrict public sharing
  });

  // 4. Construct direct online image URL
  // lh3.googleusercontent.com/d/{fileId} is Google Drive's high-speed direct CDN URL
  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  return { fileId, directUrl };
}
