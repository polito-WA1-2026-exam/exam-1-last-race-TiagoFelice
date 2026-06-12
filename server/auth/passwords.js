import crypto from 'node:crypto';

const HASH_ITERATIONS = 310000;
const HASH_KEY_LENGTH = 32;
const HASH_DIGEST = 'sha256';

function derivePasswordHash(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');

  return {
    salt,
    passwordHash: derivePasswordHash(password, salt),
  };
}

export function verifyPassword(password, salt, expectedHash) {
  const actualHash = derivePasswordHash(password, salt);
  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
