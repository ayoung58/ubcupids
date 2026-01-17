⚠️ CRITICAL DATABASE SAFETY ⚠️

DO NOT USE prisma migrate dev or prisma db push or prisma migrate reset! It can lead to data loss!!!
The database being used is for PRODUCTION!

✅ SAFE COMMANDS:

- npx prisma migrate deploy (for applying migrations)
- npm run backup (create backup - ALWAYS DO THIS BEFORE MIGRATIONS!)

🔴 DANGEROUS COMMANDS (NEVER USE):

- prisma migrate dev
- prisma db push
- prisma migrate reset

📦 BACKUP BEFORE EVERY MIGRATION:
npm run backup
npx prisma migrate deploy

See docs/DATABASE_BACKUP.md for full backup documentation.
