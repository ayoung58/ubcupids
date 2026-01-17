import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  generateV2Responses,
  generatePerfectMatchPair,
  generateDealbreakerConflictPair,
  generateAsymmetricPair,
  generateDiversePool,
} from "@/lib/questionnaire/v2/test-data-generator";

/**
 * Generate Test Users
 * POST /api/admin/generate-test-users
 *
 * Creates test users for development/testing
 * Body: {
 *   count: number,
 *   userType: "match" | "cupid",
 *   scenario?: "random" | "perfect" | "dealbreaker" | "asymmetric" | "diverse"
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const count = body.count || 125;
    const userType = body.userType || "match"; // "match" or "cupid"
    const scenario = body.scenario || "random"; // "random", "perfect", "dealbreaker", "asymmetric", "diverse"

    const hashedPassword = await hashPassword("TestPassword123!");

    // Get current test user count to ensure unique emails
    const existingTestUsers = await prisma.user.count({
      where: { isTestUser: true },
    });

    const usersToCreate = [];

    for (let i = 0; i < count; i++) {
      const userIndex = existingTestUsers + i;
      const firstName =
        userType === "cupid" ? `Cupid${userIndex}` : `Match${userIndex}`;
      const lastName = `Test`;
      const email = `test${userIndex}@student.ubc.ca`;
      const isCupid = userType === "cupid";
      const campus = Math.random() < 0.85 ? "Vancouver" : "Okanagan"; // 85% Vancouver
      const okMatchingDifferentCampus = Math.random() < 0.75; // 75% ok with different campus

      usersToCreate.push({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        cupidDisplayName: `${firstName} ${lastName}`,\n        age: 18 + (i % 10), // Ages 18-27
        campus,
        okMatchingDifferentCampus,
        emailVerified: new Date(), // Already verified
        acceptedTerms: new Date(),
        isCupid,
        isBeingMatched: !isCupid, // Cupids don't get matched by default
        isTestUser: true, // Mark as test user for easy cleanup
      });
    }

    // Create users in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    let created = 0;

    for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
      const batch = usersToCreate.slice(i, i + BATCH_SIZE);
      await prisma.user.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
    }

    // If creating cupids, also create CupidProfile records
    if (userType === "cupid") {
      const createdUsers = await prisma.user.findMany({
        where: {
          email: { in: usersToCreate.map((u) => u.email) },
        },
        select: { id: true },
      });

      const cupidProfiles = createdUsers.map((u) => ({
        userId: u.id,
        approved: true,
      }));

      await prisma.cupidProfile.createMany({
        data: cupidProfiles,
        skipDuplicates: true,
      });
    }

    // If creating match users, also create completed V2 questionnaire responses
    if (userType === "match") {
      const createdUsers = await prisma.user.findMany({
        where: {
          email: { in: usersToCreate.map((u) => u.email) },
        },
        select: { id: true },
      });

      const questionnaireResponses = [];

      // Generate responses based on scenario
      if (scenario === "perfect" && createdUsers.length >= 2) {
        // Generate perfect match pairs
        const pairCount = Math.floor(createdUsers.length / 2);
        for (let i = 0; i < pairCount; i++) {
          const [user1Response, user2Response] = generatePerfectMatchPair();

          questionnaireResponses.push({
            userId: createdUsers[i * 2].id,
            responses: user1Response.responses as any,
            freeResponse1: user1Response.freeResponse1,
            freeResponse2: user1Response.freeResponse2,
            freeResponse3: user1Response.freeResponse3 || null,
            freeResponse4: user1Response.freeResponse4 || null,
            freeResponse5: user1Response.freeResponse5 || null,
            isSubmitted: true,
            submittedAt: new Date(),
          });

          if (i * 2 + 1 < createdUsers.length) {
            questionnaireResponses.push({
              userId: createdUsers[i * 2 + 1].id,
              responses: user2Response.responses as any,
              freeResponse1: user2Response.freeResponse1,
              freeResponse2: user2Response.freeResponse2,
              freeResponse3: user2Response.freeResponse3 || null,
              freeResponse4: user2Response.freeResponse4 || null,
              freeResponse5: user2Response.freeResponse5 || null,
              isSubmitted: true,
              submittedAt: new Date(),
            });
          }
        }
      } else if (scenario === "dealbreaker" && createdUsers.length >= 2) {
        // Generate dealbreaker conflict pairs
        const pairCount = Math.floor(createdUsers.length / 2);
        for (let i = 0; i < pairCount; i++) {
          const [user1Response, user2Response] =
            generateDealbreakerConflictPair();

          questionnaireResponses.push({
            userId: createdUsers[i * 2].id,
            responses: user1Response.responses as any,
            freeResponse1: user1Response.freeResponse1,
            freeResponse2: user1Response.freeResponse2,
            freeResponse3: user1Response.freeResponse3 || null,
            freeResponse4: user1Response.freeResponse4 || null,
            freeResponse5: user1Response.freeResponse5 || null,
            isSubmitted: true,
            submittedAt: new Date(),
          });

          if (i * 2 + 1 < createdUsers.length) {
            questionnaireResponses.push({
              userId: createdUsers[i * 2 + 1].id,
              responses: user2Response.responses as any,
              freeResponse1: user2Response.freeResponse1,
              freeResponse2: user2Response.freeResponse2,
              freeResponse3: user2Response.freeResponse3 || null,
              freeResponse4: user2Response.freeResponse4 || null,
              freeResponse5: user2Response.freeResponse5 || null,
              isSubmitted: true,
              submittedAt: new Date(),
            });
          }
        }
      } else if (scenario === "asymmetric" && createdUsers.length >= 2) {
        // Generate asymmetric pairs
        const pairCount = Math.floor(createdUsers.length / 2);
        for (let i = 0; i < pairCount; i++) {
          const [user1Response, user2Response] = generateAsymmetricPair();

          questionnaireResponses.push({
            userId: createdUsers[i * 2].id,
            responses: user1Response.responses as any,
            freeResponse1: user1Response.freeResponse1,
            freeResponse2: user1Response.freeResponse2,
            freeResponse3: user1Response.freeResponse3 || null,
            freeResponse4: user1Response.freeResponse4 || null,
            freeResponse5: user1Response.freeResponse5 || null,
            isSubmitted: true,
            submittedAt: new Date(),
          });

          if (i * 2 + 1 < createdUsers.length) {
            questionnaireResponses.push({
              userId: createdUsers[i * 2 + 1].id,
              responses: user2Response.responses as any,
              freeResponse1: user2Response.freeResponse1,
              freeResponse2: user2Response.freeResponse2,
              freeResponse3: user2Response.freeResponse3 || null,
              freeResponse4: user2Response.freeResponse4 || null,
              freeResponse5: user2Response.freeResponse5 || null,
              isSubmitted: true,
              submittedAt: new Date(),
            });
          }
        }
      } else if (scenario === "diverse") {
        // Generate diverse pool
        const diversePool = generateDiversePool(createdUsers.length);
        for (let i = 0; i < createdUsers.length; i++) {
          const generated = diversePool[i];
          questionnaireResponses.push({
            userId: createdUsers[i].id,
            responses: generated.responses as any,
            freeResponse1: generated.freeResponse1,
            freeResponse2: generated.freeResponse2,
            freeResponse3: generated.freeResponse3 || null,
            freeResponse4: generated.freeResponse4 || null,
            freeResponse5: generated.freeResponse5 || null,
            isSubmitted: true,
            submittedAt: new Date(),
          });
        }
      } else {
        // Default: random generation
        for (const user of createdUsers) {
          const generated = generateV2Responses();
          questionnaireResponses.push({
            userId: user.id,
            responses: generated.responses as any,
            freeResponse1: generated.freeResponse1,
            freeResponse2: generated.freeResponse2,
            freeResponse3: generated.freeResponse3 || null,
            freeResponse4: generated.freeResponse4 || null,
            freeResponse5: generated.freeResponse5 || null,
            isSubmitted: true,
            submittedAt: new Date(),
          });
        }
      }

      // Create V2 questionnaire responses in batches
      for (let i = 0; i < questionnaireResponses.length; i += BATCH_SIZE) {
        const batch = questionnaireResponses.slice(i, i + BATCH_SIZE);
        await prisma.questionnaireResponseV2.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      message: `Generated ${created} test ${userType} users${userType === "match" ? ` with completed questionnaires (${scenario} scenario)` : ""}`,
      created,
      userType,
      scenario: userType === "match" ? scenario : undefined,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}
