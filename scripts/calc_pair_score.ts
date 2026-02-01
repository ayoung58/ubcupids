import "reflect-metadata";
import { prisma } from "../lib/prisma";
import { calculateDirectionalScoreComplete } from "../lib/matching/v2";
import { DEFAULT_CONFIG } from "../lib/matching/v2/config";

async function main() {
  const [emailA, emailB] = process.argv.slice(2);
  if (!emailA || !emailB) {
    console.error(
      "Usage: ts-node scripts/calc_pair_score.ts <emailA> <emailB>",
    );
    process.exit(1);
  }

  const userA = await prisma.user.findUnique({
    where: { email: emailA },
    include: { questionnaireResponseV2: true },
  });
  const userB = await prisma.user.findUnique({
    where: { email: emailB },
    include: { questionnaireResponseV2: true },
  });

  if (!userA) {
    console.error("User not found:", emailA);
    process.exit(1);
  }
  if (!userB) {
    console.error("User not found:", emailB);
    process.exit(1);
  }

  const buildMatchingUser = (user: any) => {
    const responses =
      (user.questionnaireResponseV2 &&
        user.questionnaireResponseV2.responses) ||
      {};
    return {
      id: user.id,
      email: user.email,
      name: user.displayName || `${user.firstName} ${user.lastName}`,
      gender: (responses.q1 && responses.q1.answer) || user.gender || "",
      interestedInGenders:
        (responses.q2 &&
          (Array.isArray(responses.q2.answer)
            ? responses.q2.answer
            : [responses.q2.answer])) ||
        [],
      campus: user.campus,
      okMatchingDifferentCampus: user.okMatchingDifferentCampus,
      responses,
      responseRecord: user.questionnaireResponseV2 || null,
    };
  };

  const mA = buildMatchingUser(userA);
  const mB = buildMatchingUser(userB);

  // Calculate score from A->B perspective and B->A perspective using the complete function
  const scoreAtoB = calculateDirectionalScoreComplete(mA, mB, DEFAULT_CONFIG);
  const scoreBtoA = calculateDirectionalScoreComplete(mB, mA, DEFAULT_CONFIG);

  // The pipeline calculates a weighted total 0-100; we can present both and their average
  const average = (scoreAtoB + scoreBtoA) / 2;

  console.log("Score A->B:", scoreAtoB.toFixed(3));
  console.log("Score B->A:", scoreBtoA.toFixed(3));
  console.log("Average compatibility:", average.toFixed(3));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
