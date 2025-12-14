/**
 * Environment Configuration
 *
 * Centralized environment variable validation and access
 * Ensures consistency across all parts of the application
 */

import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

  // Email
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),
  RESEND_FROM_EMAIL: z
    .string()
    .email("RESEND_FROM_EMAIL must be a valid email"),

  // File Storage (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be exactly 64 characters (hex)"),
});

import * as fs from "fs";
import * as path from "path";

// Load .env file manually for standalone scripts (not needed in Next.js)
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

// Parse and validate environment variables
let validatedEnv: z.infer<typeof envSchema>;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Environment variable validation failed:");

  if (error instanceof z.ZodError) {
    error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    console.error(
      `  - ${error instanceof Error ? error.message : String(error)}`
    );
  }

  console.error(
    "\nPlease check your .env file and ensure all required variables are set correctly."
  );
  console.error("See .env.example for the required format.\n");
  process.exit(1);
}

// Export validated environment variables
export const env = validatedEnv;

// Helper functions for environment checks
export const isDevelopment = () => env.NODE_ENV === "development";
export const isProduction = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";

// Environment validation function (can be called at startup)
export function validateEnvironment() {
  console.log("✅ Environment variables validated successfully");
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(
    `   Database: ${env.DATABASE_URL.split("@")[1]?.split("/")[0] || "configured"}`
  );
  console.log(`   Email: ${env.RESEND_FROM_EMAIL}`);
  console.log(`   Cloudinary: ${env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   App URL: ${env.NEXT_PUBLIC_APP_URL}`);
}

// Export individual variables for backward compatibility
export const {
  DATABASE_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  NEXT_PUBLIC_APP_URL,
  NODE_ENV,
  ENCRYPTION_KEY,
} = env;
