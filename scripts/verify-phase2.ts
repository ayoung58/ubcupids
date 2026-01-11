/**
 * Phase 2 Verification Script
 * Tests that type definitions and configurations are correctly set up
 */

import {
  ALL_QUESTIONS,
  QUESTION_BY_ID,
  getQuestionById,
  getQuestionsBySection,
} from "@/lib/questionnaire/v2/config";
import {
  Section,
  QuestionType,
  ImportanceLevel,
} from "@/types/questionnaire-v2";
import { QUESTIONNAIRE_V2_CONSTANTS } from "@/lib/questionnaire/v2/constants";

function verifyPhase2() {
  console.log("🔍 Verifying Phase 2: Type Definitions & Constants\n");

  let passed = 0;
  let total = 0;

  // Test 1: Verify all 36 questions are defined
  total++;
  console.log("Test 1: Checking question count...");
  if (ALL_QUESTIONS.length === 36) {
    console.log(`  ✓ All 36 questions defined\n`);
    passed++;
  } else {
    console.log(`  ✗ Expected 36 questions, got ${ALL_QUESTIONS.length}\n`);
  }

  // Test 2: Verify section distribution
  total++;
  console.log("Test 2: Checking section distribution...");
  const section1Questions = getQuestionsBySection(Section.SECTION_1);
  const section2Questions = getQuestionsBySection(Section.SECTION_2);
  if (section1Questions.length === 20 && section2Questions.length === 16) {
    console.log(`  ✓ Section 1: ${section1Questions.length} questions`);
    console.log(`  ✓ Section 2: ${section2Questions.length} questions\n`);
    passed++;
  } else {
    console.log(
      `  ✗ Expected 20 in Section 1, got ${section1Questions.length}`
    );
    console.log(
      `  ✗ Expected 16 in Section 2, got ${section2Questions.length}\n`
    );
  }

  // Test 3: Verify constants are accessible
  total++;
  console.log("Test 3: Checking constants...");
  const { IMPORTANCE_WEIGHTS, SECTION_WEIGHTS, AGE_LIMITS } =
    QUESTIONNAIRE_V2_CONSTANTS;
  if (
    IMPORTANCE_WEIGHTS.NOT_IMPORTANT === 0 &&
    IMPORTANCE_WEIGHTS.VERY_IMPORTANT === 2.0 &&
    SECTION_WEIGHTS.SECTION_1 === 0.65 &&
    AGE_LIMITS.MIN === 18 &&
    AGE_LIMITS.MAX === 40
  ) {
    console.log("  ✓ Importance weights correct");
    console.log("  ✓ Section weights correct");
    console.log("  ✓ Age limits correct\n");
    passed++;
  } else {
    console.log("  ✗ Constants have incorrect values\n");
  }

  // Test 4: Verify question lookup works
  total++;
  console.log("Test 4: Checking question lookup...");
  const q1 = getQuestionById("q1");
  const q21 = getQuestionById("q21");
  const q36 = getQuestionById("q36");
  if (
    q1?.id === "q1" &&
    q1?.type === QuestionType.CATEGORICAL_NO_PREFERENCE &&
    q21?.id === "q21" &&
    q21?.type === QuestionType.SPECIAL_LOVE_LANGUAGES &&
    q36?.id === "q36" &&
    q36?.section === Section.SECTION_2
  ) {
    console.log("  ✓ Question lookup by ID works");
    console.log("  ✓ Question types correctly assigned");
    console.log("  ✓ Section assignments correct\n");
    passed++;
  } else {
    console.log("  ✗ Question lookup failed\n");
  }

  // Test 5: Verify special questions are identified
  total++;
  console.log("Test 5: Checking special question types...");
  const specialQuestions = ALL_QUESTIONS.filter(
    (q) =>
      q.type === QuestionType.SPECIAL_LOVE_LANGUAGES ||
      q.type === QuestionType.SPECIAL_SLEEP_SCHEDULE ||
      q.type === QuestionType.SPECIAL_CONFLICT_RESOLUTION ||
      q.type === QuestionType.COMPOUND_SUBSTANCES_FREQUENCY
  );
  if (specialQuestions.length === 4) {
    console.log(`  ✓ Found ${specialQuestions.length} special questions:`);
    specialQuestions.forEach((q) => {
      console.log(`    - ${q.id}: ${q.type}`);
    });
    console.log("");
    passed++;
  } else {
    console.log(
      `  ✗ Expected 4 special questions, got ${specialQuestions.length}\n`
    );
  }

  // Test 6: Verify hard filters (no preference)
  total++;
  console.log("Test 6: Checking hard filters...");
  const hardFilters = ALL_QUESTIONS.filter((q) => !q.hasPreference);
  if (
    hardFilters.length === 2 &&
    hardFilters.every((q) => ["q1", "q2"].includes(q.id))
  ) {
    console.log("  ✓ Q1 (Gender Identity) has no preference");
    console.log("  ✓ Q2 (Gender Preference) has no preference");
    console.log("  ✓ All other questions have preferences\n");
    passed++;
  } else {
    console.log("  ✗ Hard filter configuration incorrect\n");
  }

  // Test 7: Verify enum values
  total++;
  console.log("Test 7: Checking TypeScript enums...");
  const importanceLevels = Object.values(ImportanceLevel);
  const questionTypes = Object.values(QuestionType);
  if (importanceLevels.length === 4 && questionTypes.length >= 10) {
    console.log(`  ✓ ImportanceLevel enum: ${importanceLevels.length} values`);
    console.log(`  ✓ QuestionType enum: ${questionTypes.length} values\n`);
    passed++;
  } else {
    console.log("  ✗ Enum values incorrect\n");
  }

  // Summary
  console.log("═".repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log("═".repeat(50));

  if (passed === total) {
    console.log("\n✅ Phase 2 verification complete! All tests passed.\n");
    console.log("Summary:");
    console.log("  • All 36 questions configured ✓");
    console.log("  • Type definitions working ✓");
    console.log("  • Constants accessible ✓");
    console.log("  • Question lookup functional ✓");
    console.log("  • Special questions identified ✓");
    console.log("  • Hard filters correct ✓");
    console.log("  • Enums properly defined ✓");
  } else {
    console.error("\n❌ Phase 2 verification failed. Some tests did not pass.");
    process.exit(1);
  }
}

verifyPhase2();
