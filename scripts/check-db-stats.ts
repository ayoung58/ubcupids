import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const usersBeingMatched = await prisma.user.count({
    where: { isBeingMatched: true },
  });
  const cupids = await prisma.user.count({ where: { isCupid: true } });
  const approvedCupids = await prisma.cupidProfile.count({
    where: { approved: true },
  });
  const responses = await prisma.questionnaireResponse.count();
  const submitted = await prisma.questionnaireResponse.count({
    where: { isSubmitted: true },
  });

  console.log("📊 Database Statistics:");
  console.log(`  Total Users: ${users}`);
  console.log(`  Users Being Matched: ${usersBeingMatched}`);
  console.log(`  Cupids: ${cupids}`);
  console.log(`  Approved Cupids: ${approvedCupids}`);
  console.log(`  Questionnaire Responses: ${responses}`);
  console.log(`  Submitted Responses: ${submitted}`);

  await prisma.$disconnect();
}

main();
