/**
 * Database Backup Script
 *
 * This script creates a backup of the PostgreSQL database using pg_dump.
 * It's safe to run anytime - it only READS data, never modifies it.
 *
 * Usage:
 *   npm run backup
 *   npm run backup -- --output=custom-name.sql
 */

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

async function backupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
    const filename = outputArg
      ? outputArg.split("=")[1]
      : `backup-${timestamp}.sql`;

    const outputPath = path.join(backupsDir, filename);

    console.log("🔒 Starting database backup...");
    console.log(`📁 Output: ${outputPath}`);

    // Connect to database
    await client.connect();

    // Get all tables
    const tablesResult = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );

    const tables = tablesResult.rows.map((row: any) => row.table_name);

    let sqlContent = `-- Database Backup created on ${new Date().toISOString()}
-- This backup contains all data from the database
-- Safe to restore without any modifications

`;

    // Get schema creation statements
    for (const table of tables) {
      const schemaResult = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = $1 ORDER BY ordinal_position`,
        [table]
      );

      sqlContent += `\n-- Table: ${table}\n`;
      sqlContent += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
      sqlContent += `CREATE TABLE "${table}" (\n`;

      const columns = schemaResult.rows;
      columns.forEach((col: any, index: number) => {
        let colDef = `  "${col.column_name}" ${col.data_type}`;
        if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
        if (col.is_nullable === "NO") colDef += ` NOT NULL`;
        if (index < columns.length - 1) colDef += `,`;
        sqlContent += colDef + "\n";
      });
      sqlContent += `);\n`;
    }

    // Get data for each table
    for (const table of tables) {
      const dataResult = await client.query(`SELECT * FROM "${table}"`);

      if (dataResult.rows.length > 0) {
        sqlContent += `\n-- Data for table: ${table}\n`;

        // Get column names
        const columns = Object.keys(dataResult.rows[0]);

        dataResult.rows.forEach((row: any) => {
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null) return "NULL";
            if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === "object")
              return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });

          sqlContent += `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});\n`;
        });
      }
    }

    // Write to file
    fs.writeFileSync(outputPath, sqlContent);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("✅ Backup completed successfully!");
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`📁 Location: ${outputPath}`);

    // Keep only the last 5 backups to save space
    cleanOldBackups(backupsDir);
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

function cleanOldBackups(backupsDir: string) {
  try {
    const files = fs
      .readdirSync(backupsDir)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => ({
        name: file,
        path: path.join(backupsDir, file),
        time: fs.statSync(path.join(backupsDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the 5 most recent backups
    if (files.length > 5) {
      console.log(`\n🧹 Cleaning up old backups (keeping 5 most recent)...`);
      files.slice(5).forEach((file) => {
        fs.unlinkSync(file.path);
        console.log(`   Deleted: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn("Warning: Could not clean old backups:", error);
  }
}

// Run the backup
backupDatabase();
