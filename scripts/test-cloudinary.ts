/**
 * Cloudinary Configuration Test Script
 *
 * Run this script to verify your Cloudinary setup:
 * npx ts-node scripts/test-cloudinary.ts
 *
 * Or with tsx:
 * npx tsx scripts/test-cloudinary.ts
 */

import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../lib/env";

console.log("\n🔍 Testing Cloudinary Configuration...\n");

// Check environment variables (already validated by env.ts)
console.log("Environment Variables:");
console.log(`  CLOUDINARY_CLOUD_NAME: ✅ Set`);
console.log(`  CLOUDINARY_API_KEY: ✅ Set`);
console.log(`  CLOUDINARY_API_SECRET: ✅ Set`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinaryConnection() {
  try {
    console.log("\n📡 Testing Cloudinary API connection...");

    // Test API by fetching account details
    const result = await cloudinary.api.ping();

    console.log("✅ Successfully connected to Cloudinary!");
    console.log(`   Status: ${result.status}`);

    return true;
  } catch (error) {
    console.log("❌ Failed to connect to Cloudinary");
    if (error instanceof Error) {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testImageUpload() {
  try {
    console.log("\n📤 Testing image upload...");

    // Create a simple test image buffer (1x1 red pixel PNG)
    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const testImageBuffer = Buffer.from(testImageBase64, "base64");

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ubcupids/test",
          resource_type: "image",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result && result.secure_url && result.public_id) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(new Error("No result returned from upload"));
          }
        }
      );

      uploadStream.end(testImageBuffer);
    });

    console.log("✅ Successfully uploaded test image!");
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}`);

    // Clean up test image
    console.log("\n🗑️  Cleaning up test image...");
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log("✅ Test image deleted");

    return true;
  } catch (error) {
    console.log("❌ Failed to upload test image");
    if (error instanceof Error) {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  const connectionSuccess = await testCloudinaryConnection();

  if (connectionSuccess) {
    await testImageUpload();
  }

  console.log("\n✨ Cloudinary configuration test completed!\n");
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
