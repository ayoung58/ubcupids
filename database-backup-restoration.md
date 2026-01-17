# Database Backup & Restore Guide

## Quick Commands

```bash
# Create backup (safe, read-only)
npm run backup

# Restore from backup (DESTRUCTIVE - replaces database)
npm run backup:restore -- --file=backup-XXXXX.sql

# List backups
ls backups/
```

## Before Any Migration

```bash
npm run backup
npx prisma migrate deploy
```

## Emergency Recovery

1. **Find backup:** `ls backups/`
2. **Restore:** `npm run backup:restore -- --file=backup-2026-01-17T08-36-50-286Z.sql`
3. **Confirm:** Type `yes` when prompted
4. **Done:** Data is recovered

## ⚠️ Critical Rules

🚫 **NEVER:** `prisma migrate dev`, `prisma db push`, `prisma migrate reset`

✅ **ALWAYS:** Backup before migrations → `npm run backup` → `npx prisma migrate deploy`

## Backup Info

- **Location:** `backups/` folder (local, not in git)
- **Safety:** Read-only, cannot change/delete data
- **Cleanup:** Automatically keeps 5 most recent backups
- **Access:** Requires `.env` file (only you can create backups)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "DATABASE_URL not set" | Verify `.env` file exists in project root |
| "Cannot connect" | Check DATABASE_URL is correct, database is running |
| Restore taking long | Normal for large databases, be patient |

---

See [docs/DATABASE_BACKUP.md](docs/DATABASE_BACKUP.md) for detailed information.
