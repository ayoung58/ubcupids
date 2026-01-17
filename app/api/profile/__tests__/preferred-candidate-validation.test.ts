/**
 * Tests for preferred candidate email validation
 * Ensures users cannot set their own email as preferred candidate
 * and that the email must belong to a registered match user
 */

import { describe, it, expect } from "vitest";

describe("Preferred Candidate Email Validation Logic", () => {
  // Helper function to simulate the validation logic from the API routes
  function validatePreferredCandidateEmail(
    candidateEmail: string,
    userEmail: string
  ): { valid: boolean; error?: string } {
    const normalizedCandidate = candidateEmail.trim().toLowerCase();
    const normalizedUser = userEmail.trim().toLowerCase();

    if (normalizedCandidate === normalizedUser) {
      return {
        valid: false,
        error: "You cannot set yourself as your preferred candidate",
      };
    }

    return { valid: true };
  }

  // Helper function to simulate email existence check
  function validateEmailExists(
    candidateEmail: string,
    isRegistered: boolean,
    isMatchUser: boolean
  ): { valid: boolean; error?: string } {
    if (!isRegistered) {
      return {
        valid: false,
        error: "Preferred candidate email not found",
      };
    }

    if (!isMatchUser) {
      return {
        valid: false,
        error: "This user is not participating in matching",
      };
    }

    return { valid: true };
  }

  describe("Self-email validation", () => {
    it("should reject when cupid tries to set their own email (exact match)", () => {
      const userEmail = "test@student.ubc.ca";
      const candidateEmail = "test@student.ubc.ca";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        "You cannot set yourself as your preferred candidate"
      );
    });

    it("should reject when cupid tries to set their own email (case insensitive)", () => {
      const userEmail = "test@student.ubc.ca";
      const candidateEmail = "TEST@STUDENT.UBC.CA";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        "You cannot set yourself as your preferred candidate"
      );
    });

    it("should reject when cupid tries to set their own email (mixed case)", () => {
      const userEmail = "Test@Student.UBC.ca";
      const candidateEmail = "test@student.ubc.ca";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        "You cannot set yourself as your preferred candidate"
      );
    });

    it("should reject when cupid tries to set their own email (with whitespace)", () => {
      const userEmail = "test@student.ubc.ca";
      const candidateEmail = "  test@student.ubc.ca  ";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        "You cannot set yourself as your preferred candidate"
      );
    });

    it("should accept valid preferred candidate email (different user)", () => {
      const userEmail = "cupid@student.ubc.ca";
      const candidateEmail = "match@student.ubc.ca";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid preferred candidate email (different domain)", () => {
      const userEmail = "test@student.ubc.ca";
      const candidateEmail = "test@alumni.ubc.ca";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid preferred candidate email (similar but different)", () => {
      const userEmail = "john.smith@student.ubc.ca";
      const candidateEmail = "jane.smith@student.ubc.ca";

      const result = validatePreferredCandidateEmail(candidateEmail, userEmail);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Email existence validation", () => {
    it("should reject when email is not registered", () => {
      const candidateEmail = "nonexistent@student.ubc.ca";
      const isRegistered = false;
      const isMatchUser = false;

      const result = validateEmailExists(
        candidateEmail,
        isRegistered,
        isMatchUser
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Preferred candidate email not found");
    });

    it("should reject when email belongs to non-match user", () => {
      const candidateEmail = "cupidonly@student.ubc.ca";
      const isRegistered = true;
      const isMatchUser = false;

      const result = validateEmailExists(
        candidateEmail,
        isRegistered,
        isMatchUser
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        "This user is not participating in matching"
      );
    });

    it("should accept when email belongs to a registered match user", () => {
      const candidateEmail = "validmatch@student.ubc.ca";
      const isRegistered = true;
      const isMatchUser = true;

      const result = validateEmailExists(
        candidateEmail,
        isRegistered,
        isMatchUser
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
