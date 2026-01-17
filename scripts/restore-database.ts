/**
 * Database Restore Script
 *
 * ⚠️ WARNING: This script WILL OVERWRITE your current database!
 * Only use this when you need to restore from a backup.
 *
 * Usage:
 *   npm run backup:restore -- --file=backup-2026-01-16.sql
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

const execAsync = promisify(exec);

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

async function restoreDatabase() {
  try {
    // Get the backup file from command line arguments
    const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
    if (!fileArg) {
      console.error(
        "❌ Error: Please specify a backup file with --file=filename.sql"
      );
      console.log(
        "\nExample: npm run backup:restore -- --file=backup-2026-01-16.sql"
      );

      // List available backups
      const backupsDir = path.join(process.cwd(), "backups");
      if (fs.existsSync(backupsDir)) {
        const files = fs
          .readdirSync(backupsDir)
          .filter((f) => f.endsWith(".sql"));
        if (files.length > 0) {
          console.log("\n📁 Available backups:");
          files.forEach((file) => console.log(`   - ${file}`));
        }
      }
      process.exit(1);
    }

    const filename = fileArg.split("=")[1];
    const backupsDir = path.join(process.cwd(), "backups");
    const backupPath = path.join(backupsDir, filename);

    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Error: Backup file not found: ${backupPath}`);
      process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Show warning and ask for confirmation
    console.log("⚠️  WARNING: DATABASE RESTORE OPERATION");
    console.log("═══════════════════════════════════════");
    console.log(
      "This will COMPLETELY REPLACE your current database with the backup."
    );
    console.log(`Backup file: ${filename}`);
    console.log("\n⚠️  ALL CURRENT DATA WILL BE LOST!");
    console.log('\nType "yes" to continue or anything else to cancel.');

    const confirmed = await askConfirmation("\nDo you want to proceed? ");

    if (!confirmed) {
      console.log("\n✅ Restore cancelled. Your database is unchanged.");
      process.exit(0);
    }

    console.log("\n🔄 Starting database restore...");
    console.log(`📁 Source: ${backupPath}`);

    // Use psql to restore the backup
    const command = `psql "${databaseUrl}" -f "${backupPath}"`;

    await execAsync(command);

    console.log("✅ Database restored successfully!");
    console.log(
      '🔄 Reminder: Run "npx prisma generate" if your schema changed.'
    );
  } catch (error) {
    console.error("❌ Restore failed:", error);
    process.exit(1);
  }
}

// Run the restore
restoreDatabase();
