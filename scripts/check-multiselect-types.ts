import { prisma } from "../lib/prisma";

async function checkMultiSelectTypes() {
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
      console.log("No user found");
      return;
    }

    const responses = user.questionnaireResponseV2.responses as any;

    console.log("\n=== Multi-select Questions Data Types ===\n");

    console.log("Q21 (Love Languages):");
    console.log("  Answer type:", typeof responses.q21?.answer);
    console.log("  Answer value:", JSON.stringify(responses.q21?.answer));
    console.log("  Preference type:", typeof responses.q21?.preference);
    console.log(
      "  Preference value:",
      JSON.stringify(responses.q21?.preference)
    );

    console.log("\nQ25 (Conflict Resolution):");
    console.log("  Answer type:", typeof responses.q25?.answer);
    console.log("  Answer value:", JSON.stringify(responses.q25?.answer));
    console.log("  Preference type:", typeof responses.q25?.preference);
    console.log(
      "  Preference value:",
      JSON.stringify(responses.q25?.preference)
    );

    console.log("\nQ32 (Multi-select):");
    console.log("  Answer type:", typeof responses.q32?.answer);
    console.log("  Answer value:", JSON.stringify(responses.q32?.answer));
    console.log("  Preference type:", typeof responses.q32?.preference);
    console.log(
      "  Preference value:",
      JSON.stringify(responses.q32?.preference)
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMultiSelectTypes();
