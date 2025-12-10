import bcrypt from "bcryptjs";

/**
 * Hashes a plain-text password using bcrypt
 *
 * @param password - Plain-text password from user input
 * @returns Promise<string> - Bcrypt hashed password (60 chars)
 *
 * Salt rounds: 12 (industry standard for 2024)
 * - 10 rounds: Fast but less secure (~150ms)
 * - 12 rounds: Balanced security/performance (~500ms) ✅
 * - 14 rounds: Very secure but slow (~2000ms)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a plain-text password against a hashed password
 *
 * @param password - Plain-text password from login attempt
 * @param hashedPassword - Bcrypt hash from database
 * @returns Promise<boolean> - True if password matches
 *
 * Security note: bcrypt.compare() is timing-safe (prevents timing attacks)
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Validates if email is a valid UBC student/alumni email
 *
 * @param email - Email address to validate
 * @returns boolean - True if valid UBC email
 *
 * Accepted domains:
 * - @student.ubc.ca (current students)
 * - @alumni.ubc.ca (alumni)
 *
 * NOT accepted for now:
 * - @ubc.ca (faculty/staff - not targeted for MVP)
 *
 * Regex breakdown:
 * - ^[a-zA-Z0-9._%+-]+ : Standard email username characters
 * - @ : Literal @ symbol
 * - (student\.ubc\.ca|alumni\.ubc\.ca) : Only these two domains
 * - $ : End of string (prevents @student.ubc.ca.malicious.com)
 * - i flag: Case-insensitive (Student.UBC.CA also valid)
 */
export function isValidUBCEmail(email: string): boolean {
  const ubcEmailRegex =
    /^[a-zA-Z0-9._%+-]+@(student\.ubc\.ca|alumni\.ubc\.ca)$/i;
  return ubcEmailRegex.test(email);
}

/**
 * Validates password strength
 *
 * @param password - Password to validate
 * @returns object - { isValid: boolean, errors: string[] }
 *
 * Requirements (industry standard for 2024):
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalizes email to prevent duplicate accounts
 *
 * @param email - Email to normalize
 * @returns string - Normalized email
 * 
 * 1. Convert to lowercase
 * 2. Trim whitespace
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
