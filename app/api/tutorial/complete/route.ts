import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tutorialId } = await request.json();

    if (!tutorialId) {
      return NextResponse.json(
        { error: "Tutorial ID is required" },
        { status: 400 }
      );
    }

    // Update the appropriate tutorial completion field
    const updateData: { [key: string]: boolean } = {};

    if (tutorialId === "match-dashboard") {
      updateData.dashboardTutorialCompleted = true;
    } else if (tutorialId === "match-profile") {
      updateData.profileTutorialCompleted = true;
    } else if (tutorialId === "questionnaire" || tutorialId === "questionnaire-v2") {
      updateData.questionnaireTutorialCompleted = true;
    } else if (tutorialId === "cupid-portal") {
      updateData.cupidPortalTutorialCompleted = true;
    } else {
      return NextResponse.json(
        { error: "Invalid tutorial ID" },
        { status: 400 }
      );
    }

    console.log("Updating tutorial for user:", session.user.id, "with data:", updateData);
    
    const result = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    
    console.log("Tutorial updated successfully:", result.questionnaireTutorialCompleted);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tutorial completion:", error);
    return NextResponse.json(
      { error: "Failed to update tutorial completion" },
      { status: 500 }
    );
  }
}
