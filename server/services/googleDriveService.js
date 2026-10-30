import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Helper to build Google OAuth2 client
 */
export const createOAuth2Client = (redirectUri = null) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI || 'https://ialksng.me/work/projects/smartsphere/app/api/cloud/google/callback'
  );
};

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Generate Google OAuth Consent Screen URL
 */
export const getDriveAuthUrl = (userId, customRedirectUri = null) => {
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    'https://ialksng.me/work/projects/smartsphere/app/api/cloud/google/callback';

  const oauth2Client = createOAuth2Client(redirectUri);

  // Encode state as JSON so callback can preserve userId and redirectUri
  const state = JSON.stringify({ userId, redirectUri });

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPES,
    state,
  });
};

/**
 * Exchange callback code for tokens
 */
export const exchangeCodeForTokens = async (code, customRedirectUri = null) => {
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    'https://ialksng.me/work/projects/smartsphere/app/api/cloud/google/callback';

  const oauth2Client = createOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Get authenticated Google Drive v3 client for a user
 */
export const getDriveClient = (user) => {
  if (!user.googleDriveTokens || !user.googleDriveTokens.access_token) {
    throw new Error('Google Drive account not connected for this user.');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(user.googleDriveTokens);

  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * List files in Google Drive
 */
export const listDriveFiles = async (user, folderId = 'root', search = '') => {
  const drive = getDriveClient(user);

  let q = `'${folderId || 'root'}' in parents and trashed = false`;
  if (search && search.trim()) {
    q = `name contains '${search.replace(/'/g, "\\'")}' and trashed = false`;
  }

  const res = await drive.files.list({
    q,
    pageSize: 50,
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)',
  });

  return (res.data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? parseInt(f.size) : 0,
    modifiedTime: f.modifiedTime,
    iconLink: f.iconLink,
    webViewLink: f.webViewLink,
  }));
};

/**
 * Get Google Drive storage quota
 */
export const getDriveStorage = async (user) => {
  const drive = getDriveClient(user);
  const res = await drive.about.get({
    fields: 'storageQuota',
  });

  const quota = res.data.storageQuota || {};
  return {
    used: quota.usage ? parseInt(quota.usage) : 0,
    total: quota.limit ? parseInt(quota.limit) : 15 * 1024 * 1024 * 1024, // 15 GB default
  };
};

/**
 * Download a file from Google Drive
 */
export const downloadDriveFile = async (user, fileId) => {
  const drive = getDriveClient(user);

  // First fetch file metadata
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  let fileContent = '';
  // Check if it's a Google Workspace doc (Docs, Sheets) vs binary
  if (meta.data.mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' }
    );
    fileContent = res.data;
  } else {
    try {
      const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );
      fileContent = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } catch {
      fileContent = 'Binary file imported from Google Drive';
    }
  }

  return {
    id: meta.data.id,
    name: meta.data.name,
    mimeType: meta.data.mimeType,
    size: meta.data.size ? parseInt(meta.data.size) : Buffer.byteLength(fileContent),
    content: fileContent,
  };
};

/**
 * Upload a file to Google Drive
 */
export const uploadToDrive = async (user, filename, mimeType, contentOrBuffer, folderId = 'root') => {
  const drive = getDriveClient(user);

  const fileMetadata = {
    name: filename,
    parents: folderId && folderId !== 'root' ? [folderId] : undefined,
  };

  const buffer = Buffer.isBuffer(contentOrBuffer)
    ? contentOrBuffer
    : Buffer.from(contentOrBuffer || '', 'utf-8');

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const media = {
    mimeType: mimeType || 'text/plain',
    body: stream,
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, webViewLink',
  });

  return res.data;
};

