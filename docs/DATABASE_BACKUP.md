# Database Backup Guide

## Overview

This guide covers database backup strategies for the UBC Cupids production PostgreSQL database. **Never use `prisma migrate reset` or `prisma db push` on production!**

## Quick Start

### Create a Backup (Safe - Read-Only)

```bash
npm run backup
```

This creates a backup in the `/backups` folder with timestamp. Automatically keeps the 5 most recent backups.

### Restore from Backup (⚠️ Destructive)

```bash
npm run backup:restore -- --file=backup-2026-01-16T10-30-00-123Z.sql
```

## Backup Solutions

### 1. Local Backups (Implemented) ✅

**Cost:** Free  
**Storage:** Local filesystem  
**Frequency:** Manual (can be automated)

#### Features:

- ✅ Uses native PostgreSQL `pg_dump`
- ✅ No data modification - 100% safe
- ✅ Automatic cleanup (keeps 5 most recent)
- ✅ Works with any PostgreSQL database
- ✅ No external dependencies

#### Setup Requirements:

- PostgreSQL client tools installed (includes `pg_dump` and `psql`)
- `DATABASE_URL` environment variable configured

#### To install PostgreSQL client tools:

**Windows:**

- Download from: https://www.postgresql.org/download/windows/
- Or via chocolatey: `choco install postgresql`

**macOS:**

```bash
brew install postgresql
```

**Linux:**

```bash
sudo apt-get install postgresql-client
```

### 2. Automated Daily Backups (Recommended)

Use GitHub Actions to automatically backup daily:

#### Setup:

1. Add `DATABASE_URL` to GitHub Secrets
2. Create `.github/workflows/backup.yml`:

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM daily
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Install PostgreSQL Client
        run: sudo apt-get install -y postgresql-client

      - name: Create Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run backup

      - name: Upload Backup Artifact
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ github.run_number }}
          path: backups/*.sql
          retention-days: 30
```

**Features:**

- ✅ Free (GitHub Actions)
- ✅ Automated daily backups
- ✅ 30-day retention
- ✅ Manual trigger available
- ✅ No code changes needed

### 3. Cloud Storage Backup (Optional)

For long-term storage, upload backups to cloud:

#### Option A: AWS S3 (Free Tier)

```bash
# Install AWS CLI
npm install -g aws-cli

# Configure
aws configure

# Upload backup
aws s3 cp backups/backup-latest.sql s3://your-bucket/backups/
```

#### Option B: Google Cloud Storage (Free Tier)

```bash
# Install gcloud
# https://cloud.google.com/sdk/docs/install

# Upload backup
gsutil cp backups/backup-latest.sql gs://your-bucket/backups/
```

## Backup Best Practices

### 1. Backup Before Migrations

```bash
npm run backup
npx prisma migrate deploy
```

### 2. Regular Schedule

- **Development:** Before major changes
- **Production:** Daily automated + before migrations

### 3. Test Restores

Periodically verify backups work:

```bash
# Create a test database and restore there
# Never test on production!
```

### 4. Multiple Locations

- Keep local backups (fast recovery)
- Store off-site (disaster recovery)
- Version control migration files separately

### 5. Monitor Backup Size

```bash
# Check backup sizes
ls -lh backups/
```

## Recovery Procedures

### Scenario 1: Accidental Data Deletion

1. Stop the application immediately
2. Identify the most recent good backup
3. Restore: `npm run backup:restore -- --file=backup-xxx.sql`
4. Verify data integrity
5. Restart application

### Scenario 2: Failed Migration

1. Check migration status: `npx prisma migrate status`
2. If corrupted, restore backup
3. Review and fix migration
4. Reapply: `npx prisma migrate deploy`

### Scenario 3: Complete Database Loss

1. Restore from most recent backup
2. Reapply any migrations after backup timestamp
3. Manually recover any data created after backup

## What Gets Backed Up

✅ **Included:**

- All table data
- Sequences (IDs)
- Constraints
- Indexes

❌ **Not Included (by default):**

- User roles/permissions (use `--no-owner`)
- Tablespace assignments
- Large objects in separate files

## Backup File Structure

```
backups/
  ├── backup-2026-01-16T10-00-00-000Z.sql  (most recent)
  ├── backup-2026-01-15T10-00-00-000Z.sql
  ├── backup-2026-01-14T10-00-00-000Z.sql
  ├── backup-2026-01-13T10-00-00-000Z.sql
  └── backup-2026-01-12T10-00-00-000Z.sql  (oldest, will be deleted on next backup)
```

## Troubleshooting

### Error: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools (see Setup Requirements above)

### Error: "connection refused"

**Solution:** Check DATABASE_URL is correct and database is accessible

### Backup file is 0 bytes

**Solution:** Check database credentials and network connectivity

### Restore taking too long

**Solution:** Normal for large databases. Use `--jobs` flag for parallel restore:

```bash
pg_restore --jobs=4 backup.sql
```

## Security Considerations

⚠️ **Important:**

- Backup files contain **all your data** including passwords (encrypted)
- Never commit backups to git (already in .gitignore)
- Secure backup files appropriately
- Use encryption for cloud storage
- Rotate old backups regularly

## Cost Comparison

| Solution                  | Cost         | Setup Time | Reliability |
| ------------------------- | ------------ | ---------- | ----------- |
| Local Backups             | Free         | 5 min      | ⭐⭐⭐      |
| GitHub Actions            | Free         | 15 min     | ⭐⭐⭐⭐⭐  |
| AWS S3                    | ~$0.10/month | 30 min     | ⭐⭐⭐⭐⭐  |
| Database Provider Backups | Varies       | 5 min      | ⭐⭐⭐⭐⭐  |

## Alternative: Database Provider Backups

Many PostgreSQL providers offer built-in backups:

- **Vercel Postgres:** Automatic daily backups (Pro plan)
- **Supabase:** Point-in-time recovery (Pro plan)
- **Railway:** Manual backups available
- **Render:** Automatic backups (paid plans)
- **Heroku:** Continuous protection (paid)

Check your provider's documentation for their backup features.

## Next Steps

1. ✅ **Done:** Local backup script created
2. ⏭️ **Recommended:** Set up GitHub Actions for automated backups
3. ⏭️ **Optional:** Configure cloud storage for long-term retention
4. ⏭️ **Important:** Test restore process in development environment

## Questions?

- Check Prisma docs: https://www.prisma.io/docs/guides/migrate/production-troubleshooting
- PostgreSQL backup docs: https://www.postgresql.org/docs/current/backup.html
