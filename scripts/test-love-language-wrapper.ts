import { prisma } from "../lib/prisma";

async function testLoveLanguageWrapper() {
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
      take: 2,
    });

    const userA = users[0];
    const userB = users[1];

    if (!userA?.questionnaireResponseV2 || !userB?.questionnaireResponseV2) {
      console.error("One or both users missing questionnaireResponseV2");
      return;
    }

    const aResponse = (userA.questionnaireResponseV2.responses as any).q21;
    const bResponse = (userB.questionnaireResponseV2.responses as any).q21;

    console.log("User A Q21 Response:");
    console.log(JSON.stringify(aResponse, null, 2));
    console.log();

    console.log("User B Q21 Response:");
    console.log(JSON.stringify(bResponse, null, 2));
    console.log();

    // Test the transformation logic from the wrapper
    const aLoveLanguage = {
      show: Array.isArray(aResponse.answer)
        ? aResponse.answer
        : [aResponse.answer],
      receive: Array.isArray(aResponse.preference)
        ? aResponse.preference
        : aResponse.preference
          ? [aResponse.preference]
          : aResponse.answer,
    };

    const bLoveLanguage = {
      show: Array.isArray(bResponse.answer)
        ? bResponse.answer
        : [bResponse.answer],
      receive: Array.isArray(bResponse.preference)
        ? bResponse.preference
        : bResponse.preference
          ? [bResponse.preference]
          : bResponse.answer,
    };

    console.log("Transformed A:");
    console.log(JSON.stringify(aLoveLanguage, null, 2));
    console.log();

    console.log("Transformed B:");
    console.log(JSON.stringify(bLoveLanguage, null, 2));
    console.log();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoveLanguageWrapper();
