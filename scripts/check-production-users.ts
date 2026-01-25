import { prisma } from "../lib/prisma";

async function checkProductionUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isTestUser: false,
        questionnaireResponseV2: {
          isSubmitted: true,
        },
      },
      include: {
        questionnaireResponseV2: true,
      },
      take: 5,
    });

    console.log(`\nProduction users with V2 questionnaires: ${users.length}`);

    if (users.length === 0) {
      console.log(
        "❌ No production users found with completed V2 questionnaires"
      );
      console.log("\nThis is why matching fails for production users.");
      console.log("You need to either:");
      console.log(
        "  1. Have real production users complete the V2 questionnaire"
      );
      console.log("  2. Use 'Test Users' mode for testing with test data");
    } else {
      console.log("\n✅ Found production users with V2 data:");
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Has V2: ${!!user.questionnaireResponseV2}`);
        if (user.questionnaireResponseV2) {
          const responses = user.questionnaireResponseV2.responses as any;
          console.log(
            `   Response count: ${Object.keys(responses).length} questions`
          );
          console.log(`   Has Q1 (gender): ${!!responses.q1}`);
          console.log(`   Has Q2 (preferences): ${!!responses.q2}`);
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionUsers();
