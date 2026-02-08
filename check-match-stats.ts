import { prisma } from "./lib/prisma";

async function checkMatchStats() {
  console.log("\n=== PRODUCTION USER MATCH STATS ===\n");

  const prodAlgo = await prisma.match.count({
    where: {
      matchType: "algorithm",
      batchNumber: 1,
      user: { isTestUser: false },
    },
  });

  const prodCupidSent = await prisma.match.count({
    where: {
      matchType: "cupid_sent",
      batchNumber: 1,
      user: { isTestUser: false },
    },
  });

  const prodCupidRec = await prisma.match.count({
    where: {
      matchType: "cupid_received",
      batchNumber: 1,
      user: { isTestUser: false },
    },
  });

  const prodTotal = await prisma.match.count({
    where: {
      batchNumber: 1,
      user: { isTestUser: false },
    },
  });

  console.log("Algorithm Matches:", prodAlgo);
  console.log("Cupid Sent Matches:", prodCupidSent);
  console.log("Cupid Received Matches:", prodCupidRec);
  console.log("Total Match Records:", prodTotal);
  console.log("\nAlgorithm Pairs (divided by 2):", Math.floor(prodAlgo / 2));
  console.log(
    "Cupid Pairs (divided by 2):",
    Math.floor((prodCupidSent + prodCupidRec) / 2),
  );
  console.log("Total Pairs:", Math.floor(prodTotal / 2));

  // Check eligible users
  const eligibleUsers = await prisma.user.count({
    where: {
      isTestUser: false,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  console.log("\n=== USER STATS ===\n");
  console.log("Eligible Users:", eligibleUsers);

  // Check unmatched users
  const unmatchedUsers = await prisma.user.count({
    where: {
      isTestUser: false,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
      AND: [
        {
          matchesGiven: {
            none: {
              matchType: "algorithm",
              batchNumber: 1,
            },
          },
        },
        {
          matchesReceived: {
            none: {
              matchType: "algorithm",
              batchNumber: 1,
            },
          },
        },
      ],
    },
  });

  console.log("Unmatched Users (no algorithm matches):", unmatchedUsers);

  await prisma.$disconnect();
}

checkMatchStats();
