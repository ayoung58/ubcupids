import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Investigating Gender Values...\n");

  const users = await prisma.user.findMany({
    where: {
      isTestUser: true,
      questionnaireResponseV2: {
        isNot: null,
      },
    },
    include: {
      questionnaireResponseV2: true,
    },
    take: 10,
  });

  console.log("📋 Sample Users and their Gender Data:\n");

  users.forEach((user) => {
    const responses = user.questionnaireResponseV2?.responses as any;
    console.log(`User: ${user.email}`);
    console.log(
      `  Q1 (Gender Identity): ${JSON.stringify(responses?.q1, null, 2)}`
    );
    console.log(
      `  Q2 (Gender Preference): ${JSON.stringify(responses?.q2, null, 2)}`
    );
    console.log();
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
