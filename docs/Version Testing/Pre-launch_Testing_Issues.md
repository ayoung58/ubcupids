High Priority and Crucial fixes (denoted with [A]):

1. [A] Add ability for cupid users to hide all the info at the top so that questionnaire and profile stuff take up more screen space. It would be like a dropdown with the other info (i.e. matching Portal/pending/reviewed, Candidiate _ of _, and Select a match from the right panel to continue boxes) inside it. To collapse the panel containing these information, there should be an arrow beneath the panel point up that we can click. When it is closed, the arrow should point down, and we can click to expand. The split questionnaire view should expand and shrink with this action. Also, the split questionnaire view should also less gaps on the side, so it has some more width to each of the split screens.

2. [A] Allow cupids to "delete" a candidate (i.e. 'do not match') Beside the "Select" button for a candidate, there should also be a "Not a match", which will remove that candidate from the list (there should be a popup that that will say "Are you sure? This will remove this person as a potential match for your candidate"). 

3. [A] Allow more users to be shown for cupids (i.e. add 5 more). Cupids should be able to click a button next to "show compatibility score" that will generate 5 more users that they can then go through to select as a match for their candidate. 

4. [A] Cupid rationale should be mandatory (should no longer be optional). If they do not provide a brief bit of rationale, then it can't be submitted. There should be a message that says "please provide brief rationale for your match! Your match will be able to see this, and they'd appreciate it!". Both the represented candidate and the one being requested (who will accept or deny this request) will be able to see this in their card in the match reveal interface. 

5. [A] Email got AUTOMATICALLY verified on deployment version! (CRITICAL). Please tell me why this is happening! Would it also be happening on local? (SKIPPED FOR NOW, will look into this after all bugs are fixed, and create new account to test again)

6. [A] For all the admin button operations, if there are errors, there should be error messages shown in the UI when the buttons are clicked, if success, should have a success message (right above the respective button)! (i.e. run matching, generating test users, etc.)

7. [A] Make sure that when matches are revealed, human cupids cannot match anymore, even if they haven't finished matching (button to the matching portal should be disabled and should say a new message: "Matches have now been revealed to match users. Thank you cupids!"). 

8. [A] More Match portal revisions:

Color code the sections and match categories (algorithm is purple, your cupid's picks are blue, and match requests are green). Background for the cards should be color coded correctly as well.

Then, make sure the order of the "All" section is always Algorithm, Your match requests, and then match requests for you. Also, match requests should have a little red circle "notification" number on the upper right hand corner if there's 1 or more, with the number representing the number of requests. In the upper right hand corner of the "Your cupid's picks" button, if it's pending there should be a yellow clock icon to symbolize waiting, and then if it is accepted it should be a green checkmark instead, and if it is passed on it should be a red "X".

The “short bio” content should also have a label when displayed, just like interests.

Finally, cupid rationale is not seen in the match portal, please make sure that test cupids are generating rationale when they are generating their submitted matches, and that these are shown on the cards.

9. [A] Questionnaire Fixes: 

- "Anyone" option for Q3 should uncheck all other options. 
- Remove minimum characters for open text questions, but still keep it required.
- Add a reminder about choosing importance in the "Are you ready to submit" portion.
- Add a thank you page/congratulations, confirmation of submission, with a back to dashboard button. 

10. [A] When linking through profile, we can currently represent ourselves. Let's make it so that we can do that through profile too (i.e. in general, the logic will be that you CAN now represent yourself as a cupid, so remove unnecessary validation for same user, and remove any labels that suggest you can't do this). 

Medium Priority Issues:

11. [B] "Matches Received" is green checked in admin before actually revealing the matches! It is actually checked right after we match users (and before assigning cupids to candidates)

12. [B] Add password confirmation to signup page (similar to the forgot your password, so that users don't accidentlly mistype)

13. [B] For those that have a match account AND a cupid account, please put the cupid specific field (the one where you want to represent someone) in a separate header at the bottom (Cupid-related items), so that it's sectioned off.

14. [B] Get rid of the "submit proof" in the match dashboard

15. [B] If profile image is wrong file/image too large (>5 MB), should display respective error message when trying to upload.

16. [B] If two or more cupids choose the same preferred candidate: when the second tries to link with that candidate either when linking through profile (when they have a match account or afterwards on the profile page), or when signing up, they should get an error message saying "There is already a cupid that prefers to match this candidate!"

17. [B] Make sure that if a cupid doesn't get their choice of match, they get another person (but in their cupid portal, they should have a message that says "Unfortunately your preferred candidate did not get matched.")

18. [B] Matches revealed February 1 & 7, 2026 (still present on home page of matches AND cupids, should be changed to just Feb 7)

19. [B] Move the "age info" hover text to be subtext, and then for "info" hovertext it should say that the age  should be between 16 and 100 inclusive. Make sure they cannot submit with age outside that range

20. [B] Remove "Batch 1" from the match waiting screens (it still has that with a clock to the left)

Less prioritized issues

21. [C] /admin without signing in gives a blank page, need to redirect to login. Make sure the admin questionnaire editor also has this link redirect to login. 

22. [C] Add a jump to first unanswered question button for questionnaire, on top of the "jump to top" button. Maybe use an appropriate icon if text would be too clunky.

23. [C] Hide the "Show compatibility scores" button (i.e., can comment it out, but I would not like to have the feature there for production. I may re-activate it for test environment). 