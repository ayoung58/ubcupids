#!/usr/bin/env node

/**
 * Phase 5 Quick Verification Script
 *
 * Run this to verify all Phase 5 files are in place and TypeScript compiles
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Phase 5 Verification Script\n");

// Files that should exist
const requiredFiles = [
  "app/api/questionnaire/v2/save/route.ts",
  "app/api/questionnaire/v2/load/route.ts",
  "app/api/questionnaire/v2/validate/route.ts",
  "lib/questionnaire/v2/validation.ts",
  "hooks/useAutosave.ts",
  "components/questionnaire/v2/SaveStatusIndicator.tsx",
  "docs/Questionnaire/Questionnaire_Updated_Version/Phase_5_Testing_Results.md",
  "docs/Questionnaire/Questionnaire_Updated_Version/Phase_5_Summary.md",
];

let allFilesExist = true;

console.log("📁 Checking files...\n");

requiredFiles.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

console.log("\n" + "=".repeat(60) + "\n");

if (!allFilesExist) {
  console.log("❌ Some files are missing! Please check the output above.\n");
  process.exit(1);
}

console.log("✅ All required files exist!\n");
console.log("🔧 Running TypeScript compilation check...\n");

try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("\n✅ TypeScript compilation passed!\n");
} catch (error) {
  console.log("\n❌ TypeScript compilation failed!\n");
  process.exit(1);
}

console.log("=".repeat(60));
console.log("");
console.log("🎉 Phase 5 verification complete!");
console.log("");
console.log("📋 Next steps:");
console.log("  1. Start dev server: npm run dev");
console.log("  2. Navigate to /questionnaire");
console.log("  3. Complete manual tests from Phase_5_Testing_Results.md");
console.log("  4. Report any issues found");
console.log("");
console.log(
  "📝 Testing document: docs/Questionnaire/Questionnaire_Updated_Version/Phase_5_Testing_Results.md"
);
console.log("");
console.log("=".repeat(60));
console.log("");
