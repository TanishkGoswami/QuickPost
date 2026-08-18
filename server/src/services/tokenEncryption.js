import crypto from 'crypto';

/**
 * Shared Token Encryption Service (AES-256-GCM)
 * Provides centralized encryption and decryption for sensitive OAuth tokens.
 */

function getEncryptionKeys() {
  const primary = process.env.AUTODM_TOKEN_ENCRYPTION_KEY_BASE64 || process.env.TOKEN_ENCRYPTION_KEY_BASE64;

  if (process.env.NODE_ENV === 'production' && !primary) {
    console.error('💥 FATAL ERROR: TOKEN_ENCRYPTION_KEY_BASE64 environment variable is required in production.');
    throw new Error('FATAL: TOKEN_ENCRYPTION_KEY_BASE64 environment variable is required in production.');
  }

  const keys = [];

  if (primary) {
    keys.push(Buffer.from(primary, 'base64'));
  }

  const fallback = process.env.INSTAGRAM_APP_SECRET || process.env.PINTEREST_APP_SECRET || 'quickpost-secret-fallback-key-32b!';
  keys.push(crypto.createHash('sha256').update(fallback).digest());

  return keys;
}

function getPrimaryEncryptionKey() {
  return getEncryptionKeys()[0];
}

/**
 * Encrypt a token or object payload
 * @param {string|object} value
 * @returns {string} Encrypted token string formatted as enc:v1:<iv_b64>:<data_b64>
 */
export function encryptToken(value) {
  if (!value) return null;
  const payloadStr = typeof value === 'string' ? value : JSON.stringify(value);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getPrimaryEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(payloadStr, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${Buffer.concat([encrypted, tag]).toString('base64')}`;
}

/**
 * Decrypt an encrypted token string
 * @param {string} payload - String formatted as enc:v1:<iv_b64>:<data_b64>
 * @returns {string|object} Decrypted string or parsed object
 */
export function decryptToken(payload) {
  if (!payload) return null;
  if (typeof payload === 'string' && !payload.startsWith('enc:v1:')) {
    // Return plaintext as-is if unencrypted (for backwards compatibility during migration)
    return payload;
  }

  const [, , ivB64, dataB64] = payload.split(':');
  const data = Buffer.from(dataB64, 'base64');
  const encrypted = data.subarray(0, -16);
  const tag = data.subarray(-16);
  let lastError;

  for (const key of getEncryptionKeys()) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
      try {
        return JSON.parse(decrypted);
      } catch (jsonErr) {
        return decrypted;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Token decryption failed: ${lastError?.message || 'invalid ciphertext'}`);
}
