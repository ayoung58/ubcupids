import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

/**
 * POST /api/profile/upload-picture
 * Upload profile picture to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get current user to check for existing profile picture
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePicture: true },
    });

    // Delete old profile picture from Cloudinary if exists
    if (user?.profilePicture) {
      await deleteFromCloudinary(user.profilePicture);
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(buffer, "ubcupids/profiles");

    // Update user's profile picture URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: imageUrl },
      select: { profilePicture: true },
    });

    return NextResponse.json({
      url: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/upload-picture
 * Delete profile picture
 */
export async function DELETE() {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's profile picture
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePicture: true },
    });

    if (!user?.profilePicture) {
      return NextResponse.json(
        { error: "No profile picture to delete" },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(user.profilePicture);

    // Update user to remove profile picture URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return NextResponse.json(
      { error: "Failed to delete profile picture" },
      { status: 500 }
    );
  }
}
