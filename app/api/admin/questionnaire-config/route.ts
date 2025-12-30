import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_PATH = path.join(
  process.cwd(),
  "src/data/questionnaire-config.json"
);

/**
 * Get Questionnaire Config
 * GET /api/admin/questionnaire-config
 *
 * Returns the current questionnaire configuration
 */
export async function GET() {
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

    // Read the config file
    const configData = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(configData);

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error reading questionnaire config:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 500 }
    );
  }
}

/**
 * Update Questionnaire Config
 * POST /api/admin/questionnaire-config
 *
 * Updates the questionnaire configuration
 */
export async function POST(request: NextRequest) {
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
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: "Configuration is required" },
        { status: 400 }
      );
    }

    // Validate config structure
    if (
      !config.agreement ||
      !config.sections ||
      !Array.isArray(config.sections)
    ) {
      return NextResponse.json(
        { error: "Invalid configuration structure" },
        { status: 400 }
      );
    }

    // Validate each section has required fields
    for (const section of config.sections) {
      if (!section.id || !section.title || !Array.isArray(section.questions)) {
        return NextResponse.json(
          { error: `Invalid section structure: ${section.id || "unknown"}` },
          { status: 400 }
        );
      }

      // Validate each question
      for (const question of section.questions) {
        if (!question.id || !question.type || !question.text) {
          return NextResponse.json(
            { error: `Invalid question structure in section ${section.id}` },
            { status: 400 }
          );
        }
      }
    }

    // Create a backup of the current config
    const backupPath = path.join(
      process.cwd(),
      `src/data/questionnaire-config.backup.${Date.now()}.json`
    );

    try {
      const currentConfig = await fs.readFile(CONFIG_PATH, "utf-8");
      await fs.writeFile(backupPath, currentConfig, "utf-8");
    } catch {
      // Ignore backup errors
    }

    // Write the new config
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
    });
  } catch (error) {
    console.error("Error saving questionnaire config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
