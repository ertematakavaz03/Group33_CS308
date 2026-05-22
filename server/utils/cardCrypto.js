/**
 * Payment card encryption utilities.
 *
 * Card numbers are encrypted at rest with AES-256-GCM — an authenticated
 * cipher, so any tampering with the stored ciphertext is detected on decrypt.
 *
 * SECURITY NOTES:
 *  - The CVV/CVC is NEVER stored, encrypted or otherwise (PCI-DSS requirement).
 *  - The full card number is only ever decrypted server-side; API responses
 *    expose only the last 4 digits.
 *  - The key lives in process.env.CARD_ENCRYPTION_KEY (64 hex chars / 32 bytes).
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM

function getKey() {
  const hex = process.env.CARD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be set to a 64-character hex string');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * @returns {string} "iv:authTag:ciphertext" — all hex encoded
 */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a payload produced by encrypt().
 * @returns {string} plaintext
 */
function decrypt(payload) {
  const parts = String(payload).split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [ivHex, authTagHex, dataHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

/**
 * Luhn checksum validation for a card number (digits only).
 */
function luhnCheck(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Best-effort card brand detection from the leading digits.
 */
function detectBrand(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6/.test(digits)) return 'Discover';
  return 'Card';
}

module.exports = { encrypt, decrypt, luhnCheck, detectBrand };
