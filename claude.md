DO NOT USE prisma migrate dev or prisma db push or prisma migrate reset! It can lead to data loss!!! The database being used is for PRODUCTION!
Use npx prisma migrate deploy, and also make sure to use migration scripts (sql scripts).
