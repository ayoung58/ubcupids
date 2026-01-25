import { prisma } from "../lib/prisma";

async function debugProductionResponse() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        isTestUser: false,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
      include: {
        questionnaireResponseV2: true,
      },
    });

    if (!user || !user.questionnaireResponseV2) {
      console.log("No production user found");
      return;
    }

    console.log(`\nUser: ${user.email}`);
    console.log(`User ID: ${user.id}`);

    const responses = user.questionnaireResponseV2.responses as any;

    console.log("\n--- Sample Responses ---");
    console.log("Q1 (Gender):", JSON.stringify(responses.q1, null, 2));
    console.log("Q2 (Preferences):", JSON.stringify(responses.q2, null, 2));
    console.log("Q3:", JSON.stringify(responses.q3, null, 2));
    console.log("Q4 (Age):", JSON.stringify(responses.q4, null, 2));
    console.log(
      "Q21 (Love Languages):",
      JSON.stringify(responses.q21, null, 2)
    );

    console.log("\n--- Checking for issues ---");

    // Check if responses have the expected structure
    for (const [key, value] of Object.entries(responses)) {
      const resp = value as any;

      if (!resp.answer && resp.answer !== 0) {
        console.log(`⚠️ ${key}: Missing 'answer' field`);
      }

      if (
        resp.importance &&
        ![
          "NOT_IMPORTANT",
          "SOMEWHAT_IMPORTANT",
          "IMPORTANT",
          "VERY_IMPORTANT",
        ].includes(resp.importance)
      ) {
        console.log(`⚠️ ${key}: Invalid importance value: ${resp.importance}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductionResponse();
