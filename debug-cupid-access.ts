import { prisma } from "./lib/prisma";
import { getCurrentUser } from "./lib/get-session";

async function debugDateCheck() {
  // Simulate what happens in the cupid dashboard page
  const session = await getCurrentUser();

  if (!session?.user) {
    console.log("Not logged in");
    return;
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      cupidDisplayName: true,
      isCupid: true,
      isBeingMatched: true,
      isTestUser: true,
    },
  });

  if (!profile?.isCupid) {
    console.log("User is not a cupid");
    console.log("Profile:", profile);
    return;
  }

  // Get assignments
  const totalAssignments = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      cupidUser: {
        isTestUser: profile?.isTestUser ?? false,
      },
      candidate: {
        isTestUser: profile?.isTestUser ?? false,
      },
    },
  });

  const isProductionCupid = !profile?.isTestUser;
  const currentDate = new Date();
  const launchDate = new Date("2026-02-01T00:00:00.000Z");

  console.log("User ID:", session.user.id);
  console.log("Is Cupid:", profile.isCupid);
  console.log("Is Test User:", profile.isTestUser);
  console.log("Is Production Cupid:", isProductionCupid);
  console.log("Total Assignments:", totalAssignments);
  console.log("Current Date:", currentDate);
  console.log("Current Date ISO:", currentDate.toISOString());
  console.log("Launch Date:", launchDate);
  console.log("Launch Date ISO:", launchDate.toISOString());
  console.log(
    "Date comparison (currentDate >= launchDate):",
    currentDate >= launchDate,
  );
  console.log("Has assignments (totalAssignments > 0):", totalAssignments > 0);

  const cupidsAssigned = isProductionCupid
    ? currentDate >= launchDate && totalAssignments > 0
    : totalAssignments > 0;

  console.log("\n========== ACCESS DECISION ==========");
  console.log("cupidsAssigned:", cupidsAssigned);
  console.log("Should have access to portal:", cupidsAssigned);

  if (!cupidsAssigned) {
    if (isProductionCupid) {
      if (currentDate < launchDate) {
        console.log(
          "❌ BLOCKED: Portal not yet open for production (date < 2026-02-01)",
        );
      } else if (totalAssignments === 0) {
        console.log("❌ BLOCKED: No cupid assignments found");
      }
    } else {
      console.log("❌ BLOCKED: No cupid assignments found (test user)");
    }
  } else {
    console.log("✅ ALLOWED: Should have access to matching portal");
  }
}

debugDateCheck()
  .catch(console.error)
  .finally(() => process.exit(0));
