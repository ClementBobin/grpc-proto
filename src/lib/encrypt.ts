import crypto from 'crypto';

const KEY = crypto.randomBytes(32); // For production, store/load securely
const ALGO = 'aes-256-gcm';

/**
 * Encrypt a string and return Base64
 */
export function encryptField(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a Base64 string
 */
export function decryptField(enc: string): string {
  const data = Buffer.from(enc, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
