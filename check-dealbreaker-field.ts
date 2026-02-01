import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDealbreakerFields() {
  // Get multiple responses to find one with dealbreaker set
  const responses = await prisma.questionnaireResponseV2.findMany({
    where: {
      userId: { not: "skip" },
    },
    take: 50,
  });

  console.log(`Checking ${responses.length} questionnaire responses...`);

  let foundDealer = false;
  for (const response of responses) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qResponses = response.responses as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allResponses = Object.entries(qResponses) as [string, any][];

    for (const [qId, qResponse] of allResponses) {
      if (qResponse?.isDealer === true || qResponse?.dealbreaker === true) {
        console.log(`\n✓ Found dealbreaker in ${qId}:`);
        console.log("  Has isDealer field:", "isDealer" in qResponse);
        console.log("  Has dealbreaker field:", "dealbreaker" in qResponse);
        console.log("  isDealer value:", qResponse.isDealer);
        console.log("  dealbreaker value:", qResponse.dealbreaker);
        console.log("\nFull response:", JSON.stringify(qResponse, null, 2));
        foundDealer = true;
        break;
      }
    }
    if (foundDealer) break;
  }

  if (!foundDealer) {
    console.log("\n❌ No dealbreakers found in any responses");
    console.log("Showing sample response structure:");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sampleResponses = responses[0]?.responses as any;
    if (sampleResponses) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sample = Object.entries(sampleResponses)[5] as [string, any];
      console.log(`Sample (${sample[0]}):`, JSON.stringify(sample[1], null, 2));
    }
  }

  await prisma.$disconnect();
}

checkDealbreakerFields();
