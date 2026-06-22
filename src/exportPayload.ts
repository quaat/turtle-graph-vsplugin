const PNG_DATA_URI_PREFIX = 'data:image/png;base64,';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function decodePngDataUri(payload: unknown): Buffer {
  if (typeof payload !== 'string' || payload.length === 0) {
    throw new Error('PNG export payload is missing.');
  }
  if (!payload.startsWith(PNG_DATA_URI_PREFIX)) {
    throw new Error('PNG export payload must be a data:image/png;base64 URI.');
  }
  const base64 = payload.slice(PNG_DATA_URI_PREFIX.length);
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    throw new Error('PNG export payload is not valid base64.');
  }
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) {
    throw new Error('PNG export payload decoded to an empty file.');
  }
  if (bytes.length < PNG_MAGIC.length || !PNG_MAGIC.equals(bytes.subarray(0, PNG_MAGIC.length))) {
    throw new Error('PNG export payload does not contain PNG data.');
  }
  return bytes;
}
