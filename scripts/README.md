# Testing Scripts

This directory contains scripts for testing and development.

## Available Scripts

### 1. `seed-test-data.ts`

Seeds the database with test users and questionnaire data.

**Usage:**

```bash
npx tsx scripts/seed-test-data.ts
```

**What it does:**

- Creates test users with completed questionnaires
- Generates pairs with high compatibility scores
- Useful for initial setup and testing matching algorithm

---

### 2. `cupid-random-selections.ts`

Automatically makes random match selections for all cupids with pending assignments.

**Usage:**

```bash
npx tsx scripts/cupid-random-selections.ts
```

**What it does:**

- Finds all cupids with pending (unreviewed) assignments
- For each assignment, randomly selects one of the 5 potential matches
- Submits the selection with a test reason
- Prints summary of selections made

**When to use:**

- Testing the complete cupid workflow end-to-end
- Quickly filling in selections for testing match creation
- Verifying the submission and database update logic

**Output example:**

```
Starting random cupid selections for testing...

Found 10 pending assignments

✓ John Doe selected match 3/5 for Alice (score: 85.2%)
✓ Jane Smith selected match 1/5 for Bob (score: 92.1%)
...

=== Summary ===
✓ Successful selections: 10
✗ Failed selections: 0
Total processed: 10

Assignments per cupid:
  John Doe: 3 selections made
  Jane Smith: 5 selections made
  Mike Johnson: 2 selections made
```

---

### 3. `reset-questionnaire-data.ts`

Resets questionnaire responses (if exists).

**Usage:**

```bash
npx tsx scripts/reset-questionnaire-data.ts
```

---

### 4. `create-test-user.ts`

Creates a single test user for authentication testing.

**Usage:**

```bash
npx tsx scripts/create-test-user.ts
```

---

## Typical Testing Workflow

1. **Initial Setup:**

   ```bash
   npx tsx scripts/seed-test-data.ts
   ```

2. **Run Matching Algorithm:**

   ```bash
   # Use the admin panel or run the matching algorithm script
   ```

3. **Assign Candidates to Cupids:**

   ```bash
   # Use the admin panel or call assignCandidatesToCupids() function
   ```

4. **Test Cupid Selections:**

   ```bash
   npx tsx scripts/cupid-random-selections.ts
   ```

5. **Create Matches:**
   ```bash
   # Use the admin panel or call createCupidSelectedMatches() function
   ```

## Notes

- All scripts connect to the database specified in your `.env` file
- Make sure `DATABASE_URL` is set correctly
- Scripts use the Prisma client, so run `npx prisma generate` after schema changes
- For production, never run test scripts - they're for development only

## Troubleshooting

**"Cannot find module" errors:**

- Run `npm install` to install dependencies
- Run `npx prisma generate` to generate Prisma client

**Database connection errors:**

- Check your `DATABASE_URL` in `.env`
- Ensure the database is running
- Verify network connectivity

**"No pending assignments" message:**

- Run the assignment algorithm first
- Check that cupids are approved
- Verify candidates have completed questionnaires
