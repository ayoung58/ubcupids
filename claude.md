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

NOTE ABOUT CONFIG AND QUESTIONNAIRE:
please note that the config.ts for the questionnaire and the questionnaire have different numbering for the questions. This is intended for now; do not change as it will break the program! If I refer to a question "number" (i.e. q12), I refer to the one in the questionnaire version 2.md document's number. In that case, you would find that question and match the question content to the config.ts file if you need the question number there. If you need clarification, do let me know.
