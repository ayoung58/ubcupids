import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { NextRequest, NextResponse } from "next/server";
import CupidFeedbackEmail from "@/emails/CupidFeedbackEmail";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cupidId, message } = await request.json();

    // Validate inputs
    if (!cupidId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate message length (approximately 300 words = ~2000 characters with spaces)
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > 300) {
      return NextResponse.json(
        { error: "Message exceeds 300 word limit" },
        { status: 400 },
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    // Check if feedback already exists for this cupid
    const existingFeedback = await prisma.cupidFeedback.findUnique({
      where: {
        senderId_cupidId: {
          senderId: session.user.id,
          cupidId: cupidId,
        },
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "You have already sent feedback to this cupid" },
        { status: 400 },
      );
    }

    // Get cupid's email and name
    const cupid = await prisma.user.findUnique({
      where: { id: cupidId },
      select: {
        email: true,
        firstName: true,
        displayName: true,
      },
    });

    console.log("[Cupid Feedback] Cupid lookup result:", {
      cupidId,
      found: !!cupid,
      email: cupid?.email,
      firstName: cupid?.firstName,
    });

    if (!cupid) {
      console.error("[Cupid Feedback] ERROR: Cupid not found in database", {
        cupidId,
      });
      return NextResponse.json({ error: "Cupid not found" }, { status: 404 });
    }

    // Get sender's display name
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        displayName: true,
        firstName: true,
      },
    });

    const senderDisplayName =
      sender?.displayName || sender?.firstName || "Someone";

    // Send email to cupid FIRST before saving to database
    console.log("[Cupid Feedback] Attempting to send email:", {
      to: cupid.email,
      cupidName: cupid.firstName,
      senderName: senderDisplayName,
      senderId: session.user.id,
    });

    let emailSent = false;
    let emailError: any = null;

    try {
      const emailResult = await resend.emails.send({
        from: "UBCupids Match Message <messages@ubcupids.org>",
        to: cupid.email,
        subject: "A message from someone you matched!",
        react: CupidFeedbackEmail({
          cupidFirstName: cupid.firstName,
          senderDisplayName: senderDisplayName,
          message: message.trim(),
        }),
      });

      console.log("[Cupid Feedback] Full Resend response:", {
        emailResult,
        hasId: !!emailResult?.id,
        hasData: !!emailResult?.data,
        hasError: !!emailResult?.error,
        dataId: emailResult?.data?.id,
      });

      // Check if there's an error in the response (bounce, invalid email, etc.)
      if (emailResult?.error) {
        emailSent = false;
        emailError = emailResult.error;
        console.error("[Cupid Feedback] ❌ Resend returned an error:", {
          to: cupid.email,
          error: emailResult.error,
        });
      } else if (emailResult?.data?.id || emailResult?.id) {
        // Check if the data indicates a bounce or delivery failure
        const actualId = emailResult?.data?.id || emailResult?.id;
        emailSent = true;
        console.log("[Cupid Feedback] ✅ Email sent successfully:", {
          to: cupid.email,
          emailId: actualId,
        });
      } else {
        emailSent = false;
        emailError = "No email ID returned from Resend";
        console.warn(
          "[Cupid Feedback] ⚠️ Resend response unclear - no ID returned:",
          {
            to: cupid.email,
            response: emailResult,
          },
        );
      }
    } catch (error) {
      emailSent = false;
      emailError = error;
      console.error("[Cupid Feedback] ❌ Failed to send email:", {
        to: cupid.email,
        error: error instanceof Error ? error.message : String(error),
        errorDetails: error,
      });
    }

    // Only save to database if email was sent successfully
    if (!emailSent) {
      console.error(
        "[Cupid Feedback] ❌ Not saving feedback - email failed to send",
      );
      return NextResponse.json(
        {
          error:
            "Failed to send email. Please try again later. If this persists, contact support.",
        },
        { status: 500 },
      );
    }

    // Store feedback in database only after successful email send
    await prisma.cupidFeedback.create({
      data: {
        senderId: session.user.id,
        cupidId: cupidId,
        message: message.trim(),
      },
    });

    console.log("[Cupid Feedback] ✅ Feedback saved to database");

    return NextResponse.json(
      { success: true, message: "Feedback sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending cupid feedback:", error);
    return NextResponse.json(
      { error: "Failed to send feedback. Please try again." },
      { status: 500 },
    );
  }
}
