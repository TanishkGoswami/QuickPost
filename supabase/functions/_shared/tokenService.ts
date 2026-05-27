import { requireEnv } from './db.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface TokenBundle {
  pageAccessToken: string;
  userAccessToken: string;
}

const base64ToBytes = (base64: string): Uint8Array => {
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
};

const loadKey = async (): Promise<CryptoKey> => {
  const keyBase64 = requireEnv('TOKEN_ENCRYPTION_KEY_BASE64');
  const keyBytes = base64ToBytes(keyBase64);
  const keyBuffer = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  );

  if (keyBytes.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  }

  return crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
};

export const encryptTokenBundle = async (bundle: TokenBundle): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await loadKey();
  const plaintext = encoder.encode(JSON.stringify(bundle));

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return `enc:v1:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`;
};

export const decryptTokenBundle = async (ciphertext: string): Promise<TokenBundle> => {
  const [prefix, version, ivBase64, payloadBase64] = ciphertext.split(':');

  if (prefix !== 'enc' || version !== 'v1' || !ivBase64 || !payloadBase64) {
    throw new Error('Invalid encrypted token format');
  }

  const key = await loadKey();
  const iv = base64ToBytes(ivBase64);
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  const encryptedBytes = base64ToBytes(payloadBase64);
  const encryptedBuffer = encryptedBytes.buffer.slice(
    encryptedBytes.byteOffset,
    encryptedBytes.byteOffset + encryptedBytes.byteLength
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  );

  const parsed = JSON.parse(decoder.decode(new Uint8Array(decrypted))) as Partial<TokenBundle>;

  if (!parsed.pageAccessToken || !parsed.userAccessToken) {
    throw new Error('Token bundle missing expected fields');
  }

  return {
    pageAccessToken: parsed.pageAccessToken,
    userAccessToken: parsed.userAccessToken,
  };
};
