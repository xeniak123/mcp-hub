import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../config.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const key = Buffer.from(config.masterKey, 'hex');

if (key.length !== 32) {
  throw new Error('MASTER_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
}

export function encrypt(plaintext: string): Buffer {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}

export function decrypt(ciphertext: Buffer): string {
  const iv = ciphertext.subarray(0, IV_LEN);
  const tag = ciphertext.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = ciphertext.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function decryptConfig(row: { ciphertext: Buffer }): Record<string, unknown> {
  try {
    const json = decrypt(row.ciphertext);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error(
      'Cannot decrypt connector config — MASTER_ENCRYPTION_KEY changed? Re-enter the connector secrets.'
    );
  }
}
