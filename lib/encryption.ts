/**
 * Field-level encryption for sensitive user data
 * Uses AES-256-GCM for authenticated encryption
 *
 * Performance impact: ~1-2ms per operation (negligible for user-facing operations)
 * Security: Even database admins cannot read encrypted data without the key
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM

/**
 * Get encryption key from environment variable
 * Must be a 32-byte (256-bit) hex string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (key.length !== 64) {
    // 32 bytes = 64 hex characters
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64-encoded string: salt:iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();

    // Generate random IV (initialization vector) for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data (all base64 encoded, colon-separated)
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-256-GCM
 * Input format: iv:authTag:encryptedData (base64-encoded)
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();

    // Split the combined string
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid ciphertext format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt JSON object (for responses and importance ratings)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptJSON(data: any): string {
  const json = JSON.stringify(data);
  return encrypt(json);
}

/**
 * Decrypt JSON object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decryptJSON<T = any>(ciphertext: string): T {
  const json = decrypt(ciphertext);
  return JSON.parse(json) as T;
}

/**
 * Generate a new encryption key (run this once to create ENCRYPTION_KEY for .env)
 * This function is for setup only, not used in the application
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
