# UBCupids End-to-End Testing Guide

**Estimated Duration:** 90 minutes  
**Date:** January 2, 2026  
**Version:** 1.0

---

## Pre-Testing Setup (5 minutes)

### Environment Check

1. **Start Development Server**

   ```bash
   npm run dev
   ```

   - Verify it starts on `http://localhost:3000`
   - Check terminal for any errors

2. **Database Status**

   ```bash
   npx prisma studio
   ```

   - Open Prisma Studio to monitor database changes
   - Keep it open in a separate browser tab

3. **Clear Existing Test Data** (Optional - if fresh start needed)

   ```bash
   npx tsx scripts/reset-questionnaire-data.ts
   ```

4. **Browser Setup**
   - Use Chrome/Edge with DevTools open (Console + Network tabs)
   - Use Incognito/Private mode for clean session testing
   - Have 2-3 browser windows ready for multi-user testing

---

## Test Phase 1: Authentication & Registration (15 minutes)

### Test Case 1.1: New User Registration - Success Path

**Time:** 5 minutes

1. Navigate to `http://localhost:3000`
2. Click **"Get Started"** or **"Sign Up"**
3. Fill registration form:
   - **First Name:** Alice
   - **Last Name:** Test
   - **Email:** alice.test@ubc.ca (must be @ubc.ca)
   - **Password:** Test123!@# (strong password)
   - **Confirm Password:** Test123!@#

4. **Expected Results:**
   - ✅ Registration successful
   - ✅ Redirected to `/verification-pending`
   - ✅ Message: "Check your email for verification link"

5. **Verify in Prisma Studio:**
   - New user in `User` table
   - `emailVerified` = null
   - `verificationToken` exists

### Test Case 1.2: Email Verification

**Time:** 3 minutes

1. Check console output for verification URL (or check Resend dashboard if configured)
2. Copy verification token from URL or database
3. Navigate to: `http://localhost:3000/verify-email?token={TOKEN}`

4. **Expected Results:**
   - ✅ "Email verified successfully!"
   - ✅ Redirected to login page
   - ✅ In database: `emailVerified` timestamp set

### Test Case 1.3: Login - Success Path

**Time:** 2 minutes

1. Navigate to `/login`
2. Enter credentials:
   - Email: alice.test@ubc.ca
   - Password: Test123!@#
3. Click **"Sign In"**

4. **Expected Results:**
   - ✅ Redirected to `/dashboard`
   - ✅ Welcome message with user's name
   - ✅ Tutorial modal appears (if first login)

### Test Case 1.4: Registration Edge Cases

**Time:** 5 minutes

**Test invalid emails:**

- alice@gmail.com → ❌ "Must use UBC email"
- alice@student.ubc.ca → ✅ Should work
- alice@alumni.ubc.ca → ✅ Should work

**Test weak passwords:**

- "password" → ❌ Too simple
- "Pass123" → ❌ Too short
- "Pass123!@#" → ✅ Should work

**Test duplicate registration:**

- Try registering alice.test@ubc.ca again → ❌ "Email already registered"

---

## Test Phase 2: Profile Setup (10 minutes)

### Test Case 2.1: Initial Profile Completion

**Time:** 5 minutes

1. From dashboard, click **"Complete Profile"** or navigate to `/profile`
2. Fill required fields:
   - **Display Name:** Alice T.
   - **Age:** 21
   - **Gender:** Female
   - **Gender Preference:** Male
   - **Bio:** "CS major who loves hiking and coffee"
   - **Interests:** "Hiking, Coffee, Programming, Movies"
   - **Point of Contact:** @alice_insta
   - **Profile Picture:** Upload an image (test upload)

3. Check privacy toggles:
   - Toggle "Show profile picture to matches" ON
   - Toggle "Show bio to matches" ON
   - Toggle "Show interests to matches" ON
   - Toggle "Show point of contact to matches" OFF

4. Click **"Save Profile"**

5. **Expected Results:**
   - ✅ Success toast: "Profile updated successfully"
   - ✅ All fields persist after page refresh
   - ✅ Image appears in profile
   - ✅ In database: all fields saved correctly

### Test Case 2.2: Profile Picture Upload

**Time:** 3 minutes

1. Test uploading different file types:
   - ✅ JPG/JPEG
   - ✅ PNG
   - ❌ PDF (should reject)
   - ❌ File > 5MB (should reject)

2. Verify image displays correctly in:
   - Profile page
   - Avatar in header

### Test Case 2.3: Tutorial Completion

**Time:** 2 minutes

1. Click through dashboard tutorial modal
2. Verify tutorial doesn't appear again after completion
3. Check database: `dashboardTutorialCompleted` = true

---

## Test Phase 3: Questionnaire (15 minutes)

### Test Case 3.1: Complete Questionnaire - Success Path

**Time:** 10 minutes

**Setup:** Create 3 test users (Alice, Bob, Charlie) and have them complete questionnaires

**For Alice (already logged in):**

1. Navigate to `/questionnaire`
2. Read agreement section - check "I agree" and save
3. **Section 1: About You** (Basic Info)
   - Fill all required fields
   - Test sliders, radio buttons, checkboxes
   - Set importance levels (stars)

4. **Section 2: What I'm Like** (Personality)
   - Answer all personality questions
   - Vary importance ratings

5. **Section 3: What I'm Looking For** (Preferences)
   - Answer all preference questions
   - Use different importance levels

6. **Section 4: Dealbreakers** (Required matches)
   - Select critical requirements
   - Test checkbox selections

7. **Section 5: Open-Ended** (Text responses)
   - Write thoughtful 2-3 sentence responses
   - Test character limits

8. **Review & Submit**
   - Review all sections
   - Check progress indicators show 100%
   - Click **"Submit Questionnaire"**

9. **Expected Results:**
   - ✅ Success message
   - ✅ Redirected to dashboard
   - ✅ Dashboard shows "Questionnaire Complete" status
   - ✅ Database: `isSubmitted` = true, `submittedAt` timestamp set
   - ✅ Responses encrypted in database

### Test Case 3.2: Questionnaire Validation

**Time:** 5 minutes

**Test with second user (Bob):**

1. Try skipping required questions → ❌ Cannot proceed
2. Try submitting incomplete section → ❌ Validation errors
3. Test importance field requirements
4. Test text field min/max lengths
5. Verify can edit before final submission
6. Verify cannot edit after submission (read-only)

---

## Test Phase 4: Admin Dashboard Operations (15 minutes)

### Test Case 4.1: Admin Access & Setup

**Time:** 3 minutes

1. **Make Alice an admin:**

   ```sql
   -- In Prisma Studio
   UPDATE User SET isAdmin = true WHERE email = 'alice.test@ubc.ca'
   ```

2. Navigate to `/admin`
3. Verify admin dashboard displays with 4 workflow steps

### Test Case 4.2: Admin Dashboard - Status Display

**Time:** 2 minutes

**Verify Current Status Display:**

- Timeline card shows correct dates:
  - Questionnaire deadline: January 31st
  - Cupid evaluation: Feb 1-6
  - Match reveal: February 8th
- Matching status shows current state (likely "pending")
- User counts display correctly

### Test Case 4.3: Questionnaire Editor (Admin)

**Time:** 10 minutes

1. Navigate to `/admin/questionnaire-config`

**Test Question Editing:** 2. Select a question to edit 3. Change question text 4. Modify options (for radio/checkbox questions) 5. Toggle "hasImportance" setting 6. Click **"Save Changes"** 7. **Verify:** Changes appear in questionnaire preview

**Test Question Reordering:** 8. Drag a question to new position 9. Verify order persists after page refresh

**Test Adding New Question:** 10. Click **"Add Question"** 11. Fill details: - Question text - Type (radio, checkbox, slider, text, etc.) - Section assignment - Options (if applicable) 12. Save and verify appears in questionnaire

**Test Deleting Question:** 13. Delete a test question 14. Verify removal from questionnaire

**Test Read-Only Question ID:** 15. Try to edit a question ID → Should be disabled 16. Verify IDs remain stable

**Edge Cases:**

- Try saving invalid configuration → Should show validation errors
- Test all question types work correctly
- Verify changes don't break existing user responses

---

## Test Phase 5: Multi-User Setup (10 minutes)

### Test Case 5.1: Create Test User Pool

**Time:** 10 minutes

**Create 6 users minimum (use incognito windows or different browsers):**

1. **User 1: Alice** (already created, admin)
   - Gender: Female, Looking for: Male
   - Questionnaire: Complete with preferences X, Y, Z

2. **User 2: Bob**
   - Email: bob.test@ubc.ca
   - Gender: Male, Looking for: Female
   - Questionnaire: High compatibility with Alice

3. **User 3: Charlie**
   - Email: charlie.test@ubc.ca
   - Gender: Male, Looking for: Female
   - Questionnaire: Medium compatibility with Alice

4. **User 4: Diana**
   - Email: diana.test@ubc.ca
   - Gender: Female, Looking for: Male
   - Questionnaire: Complete

5. **User 5: Eve** (Cupid)
   - Email: eve.cupid@ubc.ca
   - Gender: Female
   - **Make cupid in Prisma Studio:**
     ```sql
     UPDATE User SET isCupid = true WHERE email = 'eve.cupid@ubc.ca'
     INSERT INTO CupidProfile (id, userId, approved) VALUES (cuid(), {eve_user_id}, true)
     ```

6. **User 6: Frank** (Cupid)
   - Email: frank.cupid@ubc.ca
   - Gender: Male
   - Make cupid (same process as Eve)

**Mark users ready for matching:**

```sql
-- In Prisma Studio
UPDATE User SET isBeingMatched = true
WHERE email IN ('alice.test@ubc.ca', 'bob.test@ubc.ca', 'charlie.test@ubc.ca', 'diana.test@ubc.ca')
```

---

## Test Phase 6: Matching Algorithm (10 minutes)

### Test Case 6.1: Run Algorithm Matching

**Time:** 5 minutes

**As Admin (Alice):**

1. Navigate to `/admin`
2. **Step 1: Run Matching**
   - Click **"Run Matching Algorithm"**
   - Observe progress/loading state
   - Wait for completion

3. **Expected Results:**
   - ✅ Success message
   - ✅ Status changes to "matching" then "completed"
   - ✅ Algorithm matches count displayed
   - ✅ In database:
     - `Match` records created with `matchType: "algorithm"`
     - `status: "accepted"` (auto-accepted)
     - `revealedAt: null` (not yet revealed)
   - ✅ `CompatibilityScore` records created

4. **Verify in Prisma Studio:**
   - Check `Match` table for algorithm matches
   - Verify bidirectional (Alice→Bob AND Bob→Alice)
   - Check compatibility scores

### Test Case 6.2: Algorithm Edge Cases

**Time:** 5 minutes

**Test scenarios:**

- With 0 users → Should show error
- With 1 user → Should show "not enough users"
- With incompatible gender preferences → Should show 0 matches
- Run algorithm twice → Should handle gracefully (upsert)

---

## Test Phase 7: Cupid Assignment & Matching (15 minutes)

### Test Case 7.1: Assign Candidates to Cupids

**Time:** 3 minutes

**As Admin:**

1. **Step 2: Assign Cupids to Candidates**
2. Click **"Pair Cupids with Candidates"**
3. **Expected Results:**
   - ✅ Success message with assignment count
   - ✅ In database: `CupidAssignment` records created
   - ✅ Each candidate assigned to a cupid
   - ✅ `potentialMatches` contains top 5 compatible matches

### Test Case 7.2: Cupid Dashboard Access

**Time:** 3 minutes

**As Eve (Cupid):**

1. Login as eve.cupid@ubc.ca
2. Navigate to `/cupid-dashboard`
3. **Verify displays:**
   - ✅ Assigned candidate's profile summary
   - ✅ 5 potential matches with compatibility scores
   - ✅ Profiles show key information (bio, interests, etc.)

### Test Case 7.3: Cupid Makes Selection

**Time:** 5 minutes

**As Eve (Cupid):**

1. Review candidate (e.g., Alice) and her 5 potential matches
2. Read each potential match's profile
3. Select best match (e.g., Charlie)
4. Add reasoning: "Both love hiking and have similar personalities"
5. Click **"Submit Match Selection"**

6. **Expected Results:**
   - ✅ Success confirmation
   - ✅ Cannot change selection after submission
   - ✅ Database: Selection saved in `CupidAssignment`

**As Frank (Cupid):** 7. Repeat process for his assigned candidate 8. Make different selection

### Test Case 7.4: Reveal Top 5 to Cupids

**Time:** 4 minutes

**As Admin:**

1. **Step 3: Reveal Matches to Cupids**
2. Click **"Reveal Top 5 to Cupids"**
3. **Expected Results:**
   - ✅ Success message
   - ✅ Cupid matches created in database
   - ✅ `Match` records with `matchType: "cupid_sent"` and `"cupid_received"`
   - ✅ `status: "pending"` for both directions
   - ✅ `cupidComment` included (if added)
   - ✅ Bidirectional records (Alice→Charlie AND Charlie→Alice)

---

## Test Phase 8: Match Reveal Process (15 minutes)

### Test Case 8.1: Before Reveal - User View

**Time:** 2 minutes

**As Bob (regular user):**

1. Navigate to `/matches`
2. **Expected Results:**
   - ✅ Shows "Matching in Progress" message
   - ✅ "Matches will be revealed on February 8th"
   - ✅ No matches visible yet
   - ✅ Cannot see any match details

### Test Case 8.2: Admin Reveals Matches to All Users

**Time:** 3 minutes

**As Admin:**

1. **Step 4: Reveal Matches to Candidates**
2. Click **"Reveal Matches to All Users"**
3. Confirm action

4. **Expected Results:**
   - ✅ Success message with count
   - ✅ Database: `revealedAt` timestamp set for all matches
   - ✅ `MatchingBatch.revealedAt` updated

### Test Case 8.3: User Views Algorithm Matches

**Time:** 3 minutes

**As Alice:**

1. Navigate to `/matches`
2. **Verify Algorithm Matches Section:**
   - ✅ Purple-themed card
   - ✅ Shows Bob (if matched by algorithm)
   - ✅ Displays compatibility score (e.g., "92% Compatible")
   - ✅ Full contact info visible (email or point of contact)
   - ✅ Bio, interests, profile picture displayed
   - ✅ No accept/decline buttons (auto-accepted)

**As Bob:** 3. Check his matches page 4. Verify sees Alice in algorithm matches 5. Confirm mutual visibility (both see each other)

### Test Case 8.4: User Views Match Requests (Cupid Received)

**Time:** 4 minutes

**As Alice:**

1. **Verify Match Requests Section:**
   - ✅ Green-themed card
   - ✅ Shows "Match Requests" heading
   - ✅ Displays request from Frank's candidate (if she was matched)

2. **For Pending Request:**
   - ✅ Yellow "Pending Response" badge
   - ✅ Profile info visible (name, age, bio, interests)
   - ✅ Cupid comment visible: "Both love hiking..."
   - ✅ **Contact info HIDDEN** (email/point of contact not shown)
   - ✅ Accept/Pass buttons displayed
   - ✅ Message: "Contact info will be revealed if you accept"

### Test Case 8.5: Accept Match Request

**Time:** 3 minutes

**As Alice:**

1. Click **"Accept Match"** on a pending request
2. **Expected Results:**
   - ✅ Success toast: "Match Accepted! 💘"
   - ✅ Page refreshes
   - ✅ Request moves to "Accepted" state
   - ✅ Green "Accepted ✓" badge
   - ✅ **Contact info NOW VISIBLE**
   - ✅ Accept/Pass buttons removed

3. **Verify Database:**
   - Alice's cupid_received match: `status: "accepted"`, `respondedAt` timestamp
   - Other user's cupid_sent match: also `status: "accepted"`

**As the matched user (check their cupid_sent section):** 4. Login as the user who sent the request 5. Navigate to their matches page 6. **Verify "Your Cupid's Requests" section:**

- ✅ Status changed from "⏳ Pending" to "✓ Accepted"
- ✅ Contact info now visible
- ✅ Green theme/background

### Test Case 8.6: Decline Match Request

**Time:** 2 minutes

**As Charlie:**

1. View his match requests
2. Click **"Pass"** on a request
3. **Expected Results:**
   - ✅ Toast: "Match Declined"
   - ✅ Request moves to declined state
   - ✅ Gray "Declined" badge
   - ✅ Contact info remains hidden
   - ✅ Grayed out appearance

4. **Verify sender's view:**
   - Their cupid_sent shows "✗ Declined"
   - Status clearly indicates rejection

---

## Test Phase 9: Edge Cases & Error Handling (10 minutes)

### Test Case 9.1: Authentication Edge Cases

**Time:** 3 minutes

1. **Session Management:**
   - Close browser, reopen → Should redirect to login
   - Login, navigate away, come back → Should maintain session
   - Try accessing admin page as non-admin → ❌ Redirect to dashboard

2. **Password Reset:**
   - Navigate to `/forgot-password`
   - Enter registered email
   - Verify reset email sent (check console/Resend)
   - Use reset token
   - Verify can login with new password

### Test Case 9.2: Questionnaire Edge Cases

**Time:** 3 minutes

1. **Already Submitted:**
   - Try editing after submission → Should be read-only
   - Verify "already submitted" message

2. **Partial Completion:**
   - Start questionnaire, close browser
   - Return later → Progress should be saved
   - Verify can resume from where left off

3. **Validation:**
   - Try submitting with missing required fields → Validation errors
   - Test character limits on text fields
   - Verify importance ratings work correctly

### Test Case 9.3: Matching Edge Cases

**Time:** 2 minutes

1. **No Matches Found:**
   - Create user with incompatible preferences
   - Run matching
   - Verify shows "No matches yet" message

2. **Duplicate Match Prevention:**
   - Run algorithm twice
   - Verify no duplicate matches created

### Test Case 9.4: Match Request Edge Cases

**Time:** 2 minutes

1. **Already Responded:**
   - Try responding to already-accepted request → Should show error
   - Verify cannot change response after accepting/declining

2. **Concurrent Requests:**
   - Have multiple requests pending
   - Accept one, refresh, verify others still pending
   - Test accepting multiple in sequence

---

## Test Phase 10: UI/UX Validation (5 minutes)

### Test Case 10.1: Responsive Design

**Time:** 2 minutes

1. Test on different screen sizes:
   - Mobile (375px) - use DevTools
   - Tablet (768px)
   - Desktop (1920px)

2. Verify:
   - Navigation works on mobile
   - Forms are usable
   - Match cards display correctly
   - Admin dashboard is readable

### Test Case 10.2: Visual Consistency

**Time:** 2 minutes

1. Check across all pages:
   - Consistent header/navigation
   - Proper spacing and alignment
   - Color scheme consistency
   - Button hover states work
   - Loading states display correctly

### Test Case 10.3: Accessibility Quick Check

**Time:** 1 minute

1. Tab through forms - verify keyboard navigation
2. Check color contrast in DevTools
3. Verify all buttons have proper labels

---

## Post-Testing Cleanup (5 minutes)

### Test Case 11.1: Data Cleanup (Optional)

If you want to reset for another test run:

1. **Clear matches:**

   ```bash
   npm run dev
   # Navigate to /admin
   # Click "Clear Matches" (if available)
   ```

2. **Or reset database:**

   ```bash
   npx prisma migrate reset
   # This will delete all data and re-run migrations
   ```

3. **Or clear specific data:**
   ```sql
   -- In Prisma Studio
   DELETE FROM Match;
   DELETE FROM CompatibilityScore;
   DELETE FROM CupidAssignment;
   UPDATE MatchingBatch SET status='pending', revealedAt=NULL;
   ```

---

## Testing Checklist Summary

Use this checklist to track your progress:

### Authentication ✓

- [ ] New user registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] Password reset works
- [ ] Invalid email validation works
- [ ] Duplicate email prevented

### Profile ✓

- [ ] Profile creation works
- [ ] Profile picture upload works
- [ ] Privacy toggles work
- [ ] Profile persists after refresh
- [ ] Tutorial displays and completes

### Questionnaire ✓

- [ ] All question types work
- [ ] Validation works
- [ ] Progress saves
- [ ] Submission successful
- [ ] Cannot edit after submission
- [ ] Responses encrypted in database

### Admin Dashboard ✓

- [ ] Admin access restricted properly
- [ ] Timeline displays correctly
- [ ] Status updates work
- [ ] User counts accurate

### Questionnaire Editor ✓

- [ ] Can edit questions
- [ ] Can reorder questions
- [ ] Can add/delete questions
- [ ] Question IDs read-only
- [ ] Changes persist
- [ ] Preview works

### Matching Algorithm ✓

- [ ] Algorithm runs successfully
- [ ] Creates bidirectional matches
- [ ] Sets correct status (accepted)
- [ ] Compatibility scores calculated
- [ ] Handles edge cases (0 users, etc.)

### Cupid System ✓

- [ ] Candidates assigned to cupids
- [ ] Cupid dashboard displays correctly
- [ ] Cupids can select matches
- [ ] Selections saved correctly
- [ ] Top 5 reveal creates pending matches

### Match Reveal ✓

- [ ] Before reveal shows waiting message
- [ ] Admin can reveal matches
- [ ] Algorithm matches display correctly
- [ ] Match requests show properly
- [ ] Accept/decline buttons work
- [ ] Contact info hidden for pending requests
- [ ] Contact info revealed after acceptance
- [ ] Status updates correctly (pending→accepted/declined)
- [ ] Bidirectional updates work

### Edge Cases ✓

- [ ] Session persistence works
- [ ] Invalid operations prevented
- [ ] Error messages clear
- [ ] No duplicate matches
- [ ] Cannot respond twice
- [ ] Incompatible users handled

### UI/UX ✓

- [ ] Responsive on all screen sizes
- [ ] Visual consistency maintained
- [ ] Loading states work
- [ ] Keyboard navigation works
- [ ] No console errors

---

## Critical Bugs to Watch For

Document any issues you encounter:

### High Priority Issues

- [ ] Authentication fails
- [ ] Questionnaire submission fails
- [ ] Matching algorithm crashes
- [ ] Match reveal doesn't work
- [ ] Accept/decline doesn't update status

### Medium Priority Issues

- [ ] UI rendering issues
- [ ] Slow performance
- [ ] Missing validation
- [ ] Inconsistent state

### Low Priority Issues

- [ ] Minor styling issues
- [ ] Typos
- [ ] Missing tooltips

---

## Notes Section

Use this space to document any issues, observations, or improvements:

```
Date:
Tester:
Issues Found:
1.
2.
3.

Suggestions:
1.
2.
3.
```

---

## Quick Test Scenarios (If Time Is Limited)

If you have less than 90 minutes, use these abbreviated scenarios:

### 30-Minute Quick Test

1. Create 2 users, complete questionnaires (10 min)
2. Run matching algorithm as admin (5 min)
3. View matches as both users (5 min)
4. Test one match request accept/decline (5 min)
5. Verify database changes in Prisma Studio (5 min)

### 60-Minute Standard Test

1. Authentication flow (10 min)
2. Profile + Questionnaire completion for 3 users (20 min)
3. Admin operations: matching + cupid assignment (15 min)
4. Match reveal and request handling (10 min)
5. Edge case testing (5 min)

---

**End of Testing Guide**

Good luck with your testing session! 🎯
