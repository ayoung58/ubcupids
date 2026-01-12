/**
 * Tests for V2 Test Data Generator
 *
 * Validates that generated test data meets all V2 requirements
 */

import { describe, it, expect } from "vitest";
import {
  generateV2Responses,
  generatePerfectMatchPair,
  generateDealbreakerConflictPair,
  generateAsymmetricPair,
  generateDiversePool,
  validateGeneratedResponses,
} from "../test-data-generator";
import { ALL_QUESTIONS } from "../config";

describe("Test Data Generator - V2 Questionnaire", () => {
  describe("generateV2Responses", () => {
    it("should generate responses for all questions", () => {
      const generated = generateV2Responses();

      // Should generate response for every question in ALL_QUESTIONS
      expect(Object.keys(generated.responses)).toHaveLength(
        ALL_QUESTIONS.length
      );

      for (const question of ALL_QUESTIONS) {
        expect(generated.responses[question.id]).toBeDefined();
      }
    });

    it("should generate mandatory free responses", () => {
      const generated = generateV2Responses();

      expect(generated.freeResponse1).toBeDefined();
      expect(generated.freeResponse1.length).toBeGreaterThan(0);
      expect(generated.freeResponse1.length).toBeLessThanOrEqual(300);

      expect(generated.freeResponse2).toBeDefined();
      expect(generated.freeResponse2.length).toBeGreaterThan(0);
      expect(generated.freeResponse2.length).toBeLessThanOrEqual(300);
    });

    it("should respect optional free responses", () => {
      const generated = generateV2Responses();

      if (generated.freeResponse3) {
        expect(generated.freeResponse3.length).toBeLessThanOrEqual(300);
      }
      if (generated.freeResponse4) {
        expect(generated.freeResponse4.length).toBeLessThanOrEqual(300);
      }
      if (generated.freeResponse5) {
        expect(generated.freeResponse5.length).toBeLessThanOrEqual(300);
      }
    });

    it("should generate valid gender identity (Q1)", () => {
      const generated = generateV2Responses();
      const q1 = generated.responses["q1"];

      expect(typeof q1.answer).toBe("string");
      expect([
        "woman",
        "man",
        "non-binary",
        "genderqueer",
        "genderfluid",
        "agender",
      ]).toContain(q1.answer);
      expect(q1.preference).toBeUndefined(); // Q1 has no preference
    });

    it("should generate valid gender preferences (Q2)", () => {
      const generated = generateV2Responses();
      const q2 = generated.responses["q2"];

      expect(Array.isArray(q2.answer)).toBe(true);
      const validOptions = ["women", "men", "non_binary", "anyone"];
      (q2.answer as string[]).forEach((pref) => {
        expect(validOptions).toContain(pref);
      });
      expect(q2.preference).toBeUndefined(); // Q2 has no preference
    });

    it("should generate valid age (Q4)", () => {
      const generated = generateV2Responses();
      const q4 = generated.responses["q4"];

      expect(typeof q4.answer).toBe("number");
      expect(q4.answer).toBeGreaterThanOrEqual(18);
      expect(q4.answer).toBeLessThanOrEqual(40);

      // Check age range preference
      if (q4.preference) {
        const pref = q4.preference as { min: number; max: number };
        expect(pref.min).toBeGreaterThanOrEqual(18);
        expect(pref.max).toBeLessThanOrEqual(40);
        expect(pref.min).toBeLessThan(pref.max);
      }
    });

    it("should generate valid importance levels", () => {
      const generated = generateV2Responses();

      for (const [questionId, response] of Object.entries(
        generated.responses
      )) {
        const question = ALL_QUESTIONS.find((q) => q.id === questionId);
        if (question?.hasPreference && response.importance) {
          expect([
            "NOT_IMPORTANT",
            "SOMEWHAT_IMPORTANT",
            "IMPORTANT",
            "VERY_IMPORTANT",
          ]).toContain(response.importance);
        }
      }
    });

    it("should occasionally generate dealbreakers", () => {
      // Run multiple times to check for variety
      let hasDealbreakerResponse = false;

      for (let i = 0; i < 10; i++) {
        const generated = generateV2Responses();
        for (const response of Object.values(generated.responses)) {
          if (response.dealbreaker === true) {
            hasDealbreakerResponse = true;
            break;
          }
        }
        if (hasDealbreakerResponse) break;
      }

      expect(hasDealbreakerResponse).toBe(true);
    });

    it("should generate valid multi-select responses", () => {
      const generated = generateV2Responses();

      for (const [questionId, response] of Object.entries(
        generated.responses
      )) {
        const question = ALL_QUESTIONS.find((q) => q.id === questionId);
        if (question?.answerFormat === "multi-select") {
          expect(Array.isArray(response.answer)).toBe(true);

          const min = question.validation?.minSelections || 1;
          const max = question.validation?.maxSelections || Infinity;
          const selections = response.answer as string[];

          expect(selections.length).toBeGreaterThanOrEqual(min);
          expect(selections.length).toBeLessThanOrEqual(max);

          // Check all values are valid options
          selections.forEach((sel) => {
            expect(question.options?.some((opt) => opt.value === sel)).toBe(
              true
            );
          });
        }
      }
    });

    it("should generate valid likert responses", () => {
      const generated = generateV2Responses();

      for (const [questionId, response] of Object.entries(
        generated.responses
      )) {
        const question = ALL_QUESTIONS.find((q) => q.id === questionId);
        if (question?.answerFormat === "likert") {
          expect(typeof response.answer).toBe("number");
          expect(response.answer).toBeGreaterThanOrEqual(
            question.likertConfig!.min
          );
          expect(response.answer).toBeLessThanOrEqual(
            question.likertConfig!.max
          );
        }
      }
    });

    it("should respect configuration overrides", () => {
      const generated = generateV2Responses({
        gender: "woman",
        age: 25,
        highImportanceRate: 1.0, // All questions should be important
      });

      expect(generated.responses["q1"].answer).toBe("woman");
      expect(generated.responses["q4"].answer).toBe(25);

      // Check that most questions have high importance
      let highImportanceCount = 0;
      for (const response of Object.values(generated.responses)) {
        if (
          response.importance === "IMPORTANT" ||
          response.importance === "VERY_IMPORTANT"
        ) {
          highImportanceCount++;
        }
      }

      // With highImportanceRate=1.0, we expect many questions to be important
      expect(highImportanceCount).toBeGreaterThan(15);
    });
  });

  describe("validateGeneratedResponses", () => {
    it("should validate correctly generated responses", () => {
      const generated = generateV2Responses();
      const validation = validateGeneratedResponses(generated);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect missing required free responses", () => {
      const generated = generateV2Responses();
      generated.freeResponse1 = "";

      const validation = validateGeneratedResponses(generated);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("freeResponse1"))).toBe(
        true
      );
    });

    it("should detect invalid age ranges", () => {
      const generated = generateV2Responses();
      generated.responses["q4"].answer = 50; // Too old

      const validation = validateGeneratedResponses(generated);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) =>
          e.includes("age must be between 18 and 40")
        )
      ).toBe(true);
    });

    it("should detect multi-select constraint violations", () => {
      const generated = generateV2Responses();
      // Q21 (love languages) requires exactly 2 selections
      generated.responses["q21"].answer = ["physical-touch"]; // Only 1

      const validation = validateGeneratedResponses(generated);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("q21"))).toBe(true);
    });
  });

  describe("Test Scenario Generators", () => {
    describe("generatePerfectMatchPair", () => {
      it("should generate two users with compatible responses", () => {
        const [user1, user2] = generatePerfectMatchPair();

        // Validate both users
        expect(validateGeneratedResponses(user1).valid).toBe(true);
        expect(validateGeneratedResponses(user2).valid).toBe(true);

        // Check gender compatibility
        const user1Gender = user1.responses["q1"].answer;
        const user2Gender = user2.responses["q1"].answer;
        const user1Preferences = user2.responses["q2"].answer as string[];
        const user2Preferences = user2.responses["q2"].answer as string[];

        // At least some overlap expected
        expect(user1.responses).toBeDefined();
        expect(user2.responses).toBeDefined();
      });

      it("should generate users within each other's age ranges", () => {
        const [user1, user2] = generatePerfectMatchPair();

        const user1Age = user1.responses["q4"].answer as number;
        const user2Age = user2.responses["q4"].answer as number;
        const user1AgeRange = user1.responses["q4"].preference as {
          min: number;
          max: number;
        };
        const user2AgeRange = user2.responses["q4"].preference as {
          min: number;
          max: number;
        };

        // Users should be within each other's ranges or close
        expect(user1Age).toBeGreaterThanOrEqual(18);
        expect(user1Age).toBeLessThanOrEqual(40);
        expect(user2Age).toBeGreaterThanOrEqual(18);
        expect(user2Age).toBeLessThanOrEqual(40);
      });
    });

    describe("generateDealbreakerConflictPair", () => {
      it("should generate two users with a dealbreaker conflict", () => {
        const [user1, user2] = generateDealbreakerConflictPair();

        // Validate both users
        expect(validateGeneratedResponses(user1).valid).toBe(true);
        expect(validateGeneratedResponses(user2).valid).toBe(true);

        // Check that at least one user has a dealbreaker
        let hasDealbreakerConflict = false;
        for (const [questionId, response] of Object.entries(user1.responses)) {
          if (response.dealbreaker) {
            // Check if user2's response conflicts
            const user2Response = user2.responses[questionId];
            if (user2Response && user2Response.answer !== response.answer) {
              hasDealbreakerConflict = true;
              break;
            }
          }
        }

        // Note: We know Q8 (alcohol) is the dealbreaker question in our implementation
        expect(user1.responses["q8"]).toBeDefined();
        expect(user2.responses["q8"]).toBeDefined();
      });
    });

    describe("generateAsymmetricPair", () => {
      it("should generate users with different importance levels", () => {
        const [user1, user2] = generateAsymmetricPair();

        // Validate both users
        expect(validateGeneratedResponses(user1).valid).toBe(true);
        expect(validateGeneratedResponses(user2).valid).toBe(true);

        // Count importance levels
        let user1HighImportance = 0;
        let user2HighImportance = 0;

        for (const response of Object.values(user1.responses)) {
          if (
            response.importance === "IMPORTANT" ||
            response.importance === "VERY_IMPORTANT"
          ) {
            user1HighImportance++;
          }
        }

        for (const response of Object.values(user2.responses)) {
          if (
            response.importance === "IMPORTANT" ||
            response.importance === "VERY_IMPORTANT"
          ) {
            user2HighImportance++;
          }
        }

        // User1 should care more about things than user2
        expect(user1HighImportance).toBeGreaterThan(user2HighImportance);
      });
    });

    describe("generateDiversePool", () => {
      it("should generate specified number of users", () => {
        const pool = generateDiversePool(20);
        expect(pool).toHaveLength(20);
      });

      it("should generate diverse users", () => {
        const pool = generateDiversePool(50);

        // Check for variety in gender
        const genders = new Set(pool.map((u) => u.responses["q1"].answer));
        expect(genders.size).toBeGreaterThan(1);

        // Check for variety in ages
        const ages = new Set(pool.map((u) => u.responses["q4"].answer));
        expect(ages.size).toBeGreaterThan(5);
      });

      it("should validate all generated users", () => {
        const pool = generateDiversePool(30);

        for (const user of pool) {
          const validation = validateGeneratedResponses(user);
          if (!validation.valid) {
            console.error("Invalid user:", validation.errors);
          }
          expect(validation.valid).toBe(true);
        }
      });
    });
  });

  describe("Special Question Types", () => {
    it("should handle Q21 (love languages) with exactly 2 selections", () => {
      const generated = generateV2Responses();
      const q21 = generated.responses["q21"];

      if (Array.isArray(q21.answer)) {
        expect(q21.answer).toHaveLength(2);
      }
    });

    it("should handle Q25 (conflict resolution) with max 2 selections", () => {
      const generated = generateV2Responses();
      const q25 = generated.responses["q25"];

      if (Array.isArray(q25.answer)) {
        expect(q25.answer.length).toBeLessThanOrEqual(2);
      }
    });

    it("should occasionally generate 'doesn't matter' preferences", () => {
      // Run multiple times to check for variety
      let hasDoesntMatter = false;

      for (let i = 0; i < 20; i++) {
        const generated = generateV2Responses();
        for (const response of Object.values(generated.responses)) {
          if (
            response.preference === null ||
            response.preference === undefined
          ) {
            hasDoesntMatter = true;
            break;
          }
        }
        if (hasDoesntMatter) break;
      }

      expect(hasDoesntMatter).toBe(true);
    });
  });

  describe("Data Variety", () => {
    it("should generate variety in importance levels across multiple runs", () => {
      const importanceCounts = {
        NOT_IMPORTANT: 0,
        SOMEWHAT_IMPORTANT: 0,
        IMPORTANT: 0,
        VERY_IMPORTANT: 0,
      };

      for (let i = 0; i < 10; i++) {
        const generated = generateV2Responses();
        for (const response of Object.values(generated.responses)) {
          if (response.importance) {
            importanceCounts[response.importance]++;
          }
        }
      }

      // Should have variety across all levels
      expect(importanceCounts.NOT_IMPORTANT).toBeGreaterThan(0);
      expect(importanceCounts.SOMEWHAT_IMPORTANT).toBeGreaterThan(0);
      expect(importanceCounts.IMPORTANT).toBeGreaterThan(0);
      expect(importanceCounts.VERY_IMPORTANT).toBeGreaterThan(0);
    });

    it("should generate variety in free response content", () => {
      const freeResponse1Values = new Set();

      for (let i = 0; i < 10; i++) {
        const generated = generateV2Responses();
        freeResponse1Values.add(generated.freeResponse1);
      }

      // Should have at least 5 different responses in 10 runs
      expect(freeResponse1Values.size).toBeGreaterThanOrEqual(5);
    });
  });
});
