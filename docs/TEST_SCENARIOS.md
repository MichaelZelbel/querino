# Querino Test Scenarios

End-to-end test scenarios that chain individual test cases into realistic user journeys. Each scenario simulates how a real user would interact with Querino across multiple features in a single session.

## Test Users

All test user passwords are set to `Pell@234`.

| User  | Email           | Plan         | Role  |
|-------|-----------------|--------------|-------|
| Fred  | fred@free.com   | Free         | User  |
| Peter | peter@pro.com   | Premium Gift | User  |
| Alice | alice@admin.com | Admin        | Admin |

> **Prerequisite:** Peter and Alice must be created before running premium/admin scenarios.

---

## Table of Contents

1. [TS-01: New Free User Onboarding](#ts-01-new-free-user-onboarding)
2. [TS-02: Free User Prompt Lifecycle](#ts-02-free-user-prompt-lifecycle)
3. [TS-03: Free User Discovers and Engages with Public Content](#ts-03-free-user-discovers-and-engages-with-public-content)
4. [TS-04: Free User Hits Premium Gates](#ts-04-free-user-hits-premium-gates)
5. [TS-05: Premium User AI-Assisted Prompt Creation](#ts-05-premium-user-ai-assisted-prompt-creation)
6. [TS-06: Premium User Prompt Refinement & Coaching](#ts-06-premium-user-prompt-refinement--coaching)
7. [TS-07: Premium User Skill Lifecycle](#ts-07-premium-user-skill-lifecycle)
8. [TS-08: Premium User Workflow Lifecycle](#ts-08-premium-user-workflow-lifecycle)
9. [TS-09: Premium User Claw Lifecycle](#ts-09-premium-user-claw-lifecycle)
10. [TS-10: Premium User Collections & Library Management](#ts-10-premium-user-collections--library-management)
11. [TS-11: Premium User Team Collaboration](#ts-11-premium-user-team-collaboration)
12. [TS-12: Cross-User Review & Suggestion Workflow](#ts-12-cross-user-review--suggestion-workflow)
13. [TS-13: AI Credits Consumption & Tracking](#ts-13-ai-credits-consumption--tracking)
14. [TS-14: Admin User Management & Platform Settings](#ts-14-admin-user-management--platform-settings)
15. [TS-15: Admin Blog CMS Lifecycle](#ts-15-admin-blog-cms-lifecycle)
16. [TS-16: Public Visitor Experience (Unauthenticated)](#ts-16-public-visitor-experience-unauthenticated)
17. [TS-17: Profile & Settings Management](#ts-17-profile--settings-management)
18. [TS-18: Markdown Import/Export & Version History](#ts-18-markdown-importexport--version-history)
19. [TS-19: Command Palette & Navigation](#ts-19-command-palette--navigation)
20. [TS-20: Signup Cap Enforcement](#ts-20-signup-cap-enforcement)
21. [TS-21: GitHub Sync Configuration](#ts-21-github-sync-configuration)
22. [TS-22: Cross-Artifact Discovery & Similar Items](#ts-22-cross-artifact-discovery--similar-items)
23. [TS-23: Full Cleanup Scenario](#ts-23-full-cleanup-scenario)

---

## TS-01: New Free User Onboarding

**Persona:** New visitor → Fred (Free)
**Goal:** Verify the complete signup → first login → orientation flow.
**References:** TC-AUTH-004, TC-AUTH-001, TC-AUTH-005, TC-PROFILE-001

```
Execute this test scenario:

1. Navigate to https://querino.ai
2. Validate that the landing page loads with hero section, features section, pricing preview, and public prompts section
3. Click "Sign In" in the header
4. Validate that the Auth page loads with Sign In and Sign Up tabs
5. Switch to the "Sign Up" tab
6. Validate that Google and GitHub OAuth buttons are present
7. Enter email: fred@free.com, password: Pell@234
8. Click "Sign Up"
9. Validate that a confirmation message appears or the user is logged in
10. After confirming email (or if auto-confirmed), log in with fred@free.com / Pell@234
11. Validate that the header now shows the user avatar/profile menu
12. Navigate to /settings
13. Validate that AI Credits section shows a balance (CreditsDisplay component)
14. Validate that the GitHub Sync section is visible
15. Navigate to /library
16. Validate that the library is empty with tabs: My Prompts, Skills, Workflows, Claws, Saved Prompts
17. Navigate to /dashboard
18. Validate that the dashboard loads with pinned prompts section (empty) and recent activity
19. Open Command Palette (Cmd+K / Ctrl+K)
20. Validate that navigation options are shown (Dashboard, Library, Discover, etc.)
21. Press Escape to close
22. Log all results in your test run document.
```

---

## TS-02: Free User Prompt Lifecycle

**Persona:** Fred (Free)
**Goal:** Create, edit, version, pin, export, and delete a prompt as a free user.
**References:** TC-PROMPT-FREE-001 → 005, TC-VERSION-001/002, TC-PIN-001/002, TC-MARKDOWN-001, TC-SEND-LLM-001

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)
2. Navigate to /prompts/new
3. Validate that "Suggest title, description, category & tags" button shows a lock/premium indicator
4. Enter prompt content: "You are a coding assistant. Help the user write clean, efficient code in {{language}}. Focus on best practices and explain your reasoning."
5. Enter title: "TS02 - Coding Assistant"
6. Enter description: "A prompt for coding assistance"
7. Select category: "Coding"
8. Turn OFF "Make this prompt public"
9. Click "Create Prompt"
10. Validate redirect to prompt detail page with title "TS02 - Coding Assistant" marked as private

--- Edit & Version ---
11. Click "Edit"
12. Change description to "Updated coding assistant prompt"
13. Add to content: "\nAlways provide unit tests."
14. Click "Save Changes"
15. Validate that changes are saved (autosave indicator or save confirmation)
16. Navigate to the prompt's Version History
17. Validate that at least 2 versions exist
18. If diff view is available, compare versions and validate differences are highlighted

--- Pin to Dashboard ---
19. Navigate to /library
20. Find "TS02 - Coding Assistant" in My Prompts
21. Click the Pin icon on the card
22. Navigate to /dashboard
23. Validate that "TS02 - Coding Assistant" appears in Pinned Prompts section
24. Click Unpin
25. Validate that it's removed from Pinned Prompts

--- Markdown Export ---
26. Navigate back to the prompt detail page
27. Click "Download as Markdown"
28. Validate that a .md file is downloaded

--- Send to LLM ---
29. Look for "Send to LLM" buttons (ChatGPT, Claude, Gemini)
30. Click one option
31. Validate that a new tab opens with the LLM service

--- Make Public & Verify ---
32. Click "Edit"
33. Turn ON "Make this prompt public"
34. Save changes
35. Log out
36. Navigate to /discover
37. Search for "TS02 - Coding Assistant"
38. Validate that it appears in public results

--- Cleanup ---
39. Log back in as Fred
40. Navigate to /library → My Prompts
41. Delete "TS02 - Coding Assistant"
42. Validate removal
43. Log all results in your test run document.
```

---

## TS-03: Free User Discovers and Engages with Public Content

**Persona:** Fred (Free)
**Goal:** Browse discover page, search across artifact types, save prompts, and interact with public content.
**References:** TC-DISCOVER-001 → 004, TC-LIBRARY-001/002, TC-REVIEW-001, TC-COMMENT-001

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)
2. Navigate to /discover
3. Validate that four tabs are visible: Prompts, Skills, Workflows, Claws

--- Prompts Tab ---
4. On the Prompts tab, validate that public prompts are listed
5. Click on the "Coding" category filter
6. Validate that only Coding prompts are shown
7. Click "All" to reset the filter
8. Enter a search term and validate results are filtered
9. Clear the search

--- Skills Tab ---
10. Click the "Skills" tab
11. Validate that published skills are shown (or empty state)
12. If skills exist, search for one by name

--- Workflows Tab ---
13. Click the "Workflows" tab
14. Validate that published workflows are shown (or empty state)

--- Claws Tab ---
15. Click the "Claws" tab
16. Validate that published claws are shown with amber/gold Claw badge
17. If claws exist, search for one by name

--- Save & Unsave a Prompt ---
18. Go back to Prompts tab
19. Find a public prompt (not authored by Fred)
20. Click the Save/bookmark button
21. Navigate to /library → "Saved Prompts" tab
22. Validate that the saved prompt appears
23. Click Unsave/unbookmark
24. Validate that the prompt is removed from saved

--- Review a Public Prompt ---
25. Navigate to /discover → find a public prompt by another author
26. Open its detail page
27. Scroll to Reviews section
28. Submit a 4-star review with comment: "TS03 test review"
29. Validate the review appears and average rating updates
30. Delete the review
31. Validate removal

--- Comment on a Prompt ---
32. Scroll to Comments section
33. Submit comment: "TS03 test comment"
34. Validate the comment appears
35. Delete the comment
36. Validate removal
37. Log all results in your test run document.
```

---

## TS-04: Free User Hits Premium Gates

**Persona:** Fred (Free)
**Goal:** Attempt all premium-gated features and verify proper blocking.
**References:** TC-GATE-001 → 004, TC-WIZARD-002

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)

--- AI Suggestions Gate ---
2. Navigate to /prompts/new
3. Enter content: "Test prompt content for gating test"
4. Locate "Suggest title, description, category & tags" button
5. Validate that it is disabled or shows a lock icon
6. Attempt to click it
7. Validate that either nothing happens or an upsell/premium modal appears

--- Prompt Wizard Gate ---
8. Navigate to /prompts/wizard
9. Validate that the wizard blocks usage (disabled Generate button or premium indicator)

--- Prompt Coach Gate ---
10. Navigate to /prompts/new
11. Look for "Coach" button/panel
12. Validate that it shows a PremiumGate (lock icon + "Premium Feature" message + "Contact Support")

--- Refine Prompt Gate ---
13. Navigate to a prompt detail page
14. Look for "Refine" button
15. Validate that it shows premium gating for free users

--- AI Insights Gate ---
16. Navigate to a prompt detail page
17. Look for AI Insights panel
18. Validate that PremiumGate blocks access with "Contact Support" link

--- Team Creation Gate ---
19. Navigate to /settings
20. Find Teams section
21. Validate that team creation shows premium requirement

22. Log all results in your test run document.
```

---

## TS-05: Premium User AI-Assisted Prompt Creation

**Persona:** Peter (Premium Gift)
**Goal:** Use all AI features to create a high-quality prompt: Wizard, AI suggestions, Coach, Refine.
**References:** TC-WIZARD-001, TC-PROMPT-PRO-001, TC-COACH-001, TC-REFINE-001, TC-CREDITS-002

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)
2. Navigate to /settings and note the current AI credit balance

--- Prompt Wizard ---
3. Navigate to /prompts/wizard
4. Enter goal: "Write a blog post about sustainable living"
5. Select target LLM: "ChatGPT"
6. Select a framework if available
7. Click "Generate Prompt"
8. Validate that a generated prompt appears
9. Copy the generated prompt content

--- Create Prompt with AI Suggestions ---
10. Navigate to /prompts/new
11. Paste the wizard output into the content field
12. Validate that "Suggest title, description, category & tags" button is enabled (no lock)
13. Click it
14. Validate that AI-generated suggestions appear for title, description, category, and tags
15. Accept or modify the suggestions
16. Set title to: "TS05 - AI-Assisted Sustainable Living Prompt"
17. Turn ON "Make this prompt public"
18. Click "Create Prompt"
19. Validate successful creation

--- Prompt Coach ---
20. Navigate to edit the newly created prompt
21. Open the Prompt Coach panel
22. Validate that quick action buttons are visible (e.g., "Make clearer", "Shorten", "Add examples")
23. Click "Make clearer"
24. Validate that the coach responds with a suggestion
25. Apply the suggestion to the prompt content
26. Save changes

--- Refine Prompt ---
27. Navigate to the prompt detail page
28. Click "Refine"
29. Validate that the Refine modal opens with current content
30. Optionally set a goal and framework
31. Click "Refine"
32. Validate that a refined version is generated
33. Apply the refined version
34. Save changes

--- Verify Credit Deduction ---
35. Navigate to /settings
36. Validate that AI credits have been deducted from the original balance

--- Cleanup ---
37. Navigate to /library → My Prompts
38. Delete "TS05 - AI-Assisted Sustainable Living Prompt"
39. Validate removal
40. Log all results in your test run document.
```

---

## TS-06: Premium User Prompt Refinement & Coaching

**Persona:** Peter (Premium Gift)
**Goal:** Deep-dive into Coach and Refine features on an existing prompt.
**References:** TC-COACH-001, TC-REFINE-001

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Base Prompt ---
2. Navigate to /prompts/new
3. Enter content: "Write a summary of the key points in this article: {{article_text}}"
4. Enter title: "TS06 - Article Summarizer"
5. Category: "Writing"
6. Create the prompt

--- Coach Session ---
7. Click Edit
8. Open Prompt Coach panel
9. Click "Make clearer" → validate response → apply
10. Click "Add examples" → validate response → apply
11. Click "Shorten" → validate response → decide to keep or discard
12. Save changes

--- Refine with Framework ---
13. Navigate to prompt detail
14. Click "Refine"
15. Enter goal: "Make it more structured with step-by-step instructions"
16. Select a framework if available
17. Click "Refine"
18. Validate refined output
19. Apply the refinement
20. Save

--- Version Check ---
21. Navigate to Version History
22. Validate at least 3 versions (original, after coach, after refine)
23. Compare first and last version in diff view

--- Cleanup ---
24. Delete "TS06 - Article Summarizer"
25. Log all results in your test run document.
```

---

## TS-07: Premium User Skill Lifecycle

**Persona:** Peter (Premium Gift)
**Goal:** Full lifecycle: create, edit, publish, clone, review, AI insights, and delete a skill.
**References:** TC-SKILL-001 → 003, TC-CLAW-006 (insights pattern)

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Private Skill ---
2. Navigate to /skills/new
3. Enter title: "TS07 - API Design Expert"
4. Enter description: "A skill for designing RESTful APIs"
5. Enter content:
   "# API Design Expert
   ## Role
   You are an API design expert with deep REST and GraphQL knowledge.
   ## Approach
   - Follow REST conventions
   - Design consistent resource naming
   - Plan proper error responses
   - Consider versioning strategies"
6. Leave public OFF
7. Create the skill
8. Validate it appears in /library → Skills tab

--- Edit & Publish ---
9. Open the skill, click Edit
10. Add to description: " - with versioning support"
11. Turn ON public
12. Save changes
13. Validate it's marked as public

--- Verify in Discover ---
14. Log out
15. Navigate to /discover → Skills tab
16. Search for "TS07 - API Design Expert"
17. Validate it appears with Peter as author

--- Clone as Fred ---
18. Log in as Fred (fred@free.com / Pell@234)
19. Navigate to /discover → Skills tab
20. Find "TS07 - API Design Expert"
21. Click Clone
22. Validate the clone appears in Fred's /library → Skills tab
23. Delete Fred's cloned skill

--- Review as Fred ---
24. Navigate to the original skill via /discover
25. Submit a 5-star review: "TS07 - excellent skill"
26. Validate review appears
27. Delete the review

--- AI Insights (Peter) ---
28. Log in as Peter
29. Open "TS07 - API Design Expert" detail page
30. Look for AI Insights panel
31. Click "Generate Insights" if no insights exist
32. Validate insights (summary, tags, recommendations, quality assessment)

--- Cleanup ---
33. Delete "TS07 - API Design Expert" from Peter's library
34. Log all results in your test run document.
```

---

## TS-08: Premium User Workflow Lifecycle

**Persona:** Peter (Premium Gift)
**Goal:** Full lifecycle for a Workflow artifact.
**References:** TC-WORKFLOW-001 → 003

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Private Workflow ---
2. Navigate to /workflows/new
3. Enter title: "TS08 - Data Processing Pipeline"
4. Enter description: "A workflow for ETL data processing"
5. Enter content (markdown):
   "# Data Processing Pipeline
   ## Steps
   1. Fetch data from API
   2. Transform and clean data
   3. Load into database
   4. Generate report"
6. Leave public OFF
7. Create the workflow
8. Validate it appears in /library → Workflows tab

--- Edit & Publish ---
9. Open the workflow, click Edit
10. Update description: "Updated ETL workflow"
11. Turn ON public
12. Save changes

--- Verify in Discover ---
13. Log out
14. Navigate to /discover → Workflows tab
15. Search for "TS08 - Data Processing Pipeline"
16. Validate it appears

--- Clone as Fred ---
17. Log in as Fred
18. Clone the workflow from /discover
19. Validate it appears in Fred's library
20. Delete Fred's clone

--- Review as Fred ---
21. Submit a 4-star review on the original workflow
22. Validate review appears
23. Delete the review

--- Cleanup ---
24. Log in as Peter
25. Delete "TS08 - Data Processing Pipeline"
26. Log all results in your test run document.
```

---

## TS-09: Premium User Claw Lifecycle

**Persona:** Peter (Premium Gift) & Fred (Free)
**Goal:** Full lifecycle for a Claw artifact including version history.
**References:** TC-CLAW-001 → 008

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Private Claw ---
2. Navigate to /claws/new
3. Enter title: "TS09 - Document Analyzer"
4. Enter description: "A claw for analyzing document structure"
5. Enter content:
   "# Document Analyzer
   ## Purpose
   Extract structure and metadata from documents.
   ## Capabilities
   - Parse PDF, DOCX, TXT
   - Extract headings and sections
   - Identify key entities
   - Generate summary"
6. Add tags: "analysis", "documents"
7. Leave public OFF
8. Create the claw
9. Validate it appears in /library → Claws tab

--- Edit & Publish ---
10. Open the claw, click Edit
11. Add to description: " - with entity recognition"
12. Turn ON public
13. Save changes

--- Verify in Discover ---
14. Log out
15. Navigate to /discover → Claws tab
16. Validate "TS09 - Document Analyzer" appears with amber/gold badge

--- Clone as Fred ---
17. Log in as Fred
18. Clone the claw from /discover
19. Validate clone in Fred's /library → Claws tab

--- Review as Fred ---
20. Navigate to the original claw
21. Submit a 4-star review: "TS09 - useful analyzer claw"
22. Validate review and rating update

--- Version History (Peter) ---
23. Log in as Peter
24. Open "TS09 - Document Analyzer" → Edit
25. Add capability: "- OCR support for images"
26. Save changes
27. Navigate to Version History
28. Validate at least 2 versions
29. Compare versions if diff view is available

--- Cleanup ---
30. Log in as Fred → delete cloned claw and review
31. Log in as Peter → delete "TS09 - Document Analyzer"
32. Log all results in your test run document.
```

---

## TS-10: Premium User Collections & Library Management

**Persona:** Peter (Premium Gift)
**Goal:** Create collections, add/remove items, manage saved prompts.
**References:** TC-COLLECTION-001 → 004, TC-LIBRARY-001/002

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Artifacts for Collection ---
2. Create a prompt: title "TS10 - Collection Prompt", category "Writing", public ON
3. Create a skill: title "TS10 - Collection Skill", public ON
4. Validate both appear in /library

--- Create Collection ---
5. Navigate to /collections
6. Click "Create Collection"
7. Enter title: "TS10 - My Coding Toolkit"
8. Enter description: "A collection of coding resources"
9. Leave private
10. Create it
11. Validate it appears in collections list

--- Add Items to Collection ---
12. Navigate to /discover
13. Find "TS10 - Collection Prompt"
14. Click "Add to Collection" → select "TS10 - My Coding Toolkit"
15. Repeat for "TS10 - Collection Skill" if the UI supports adding skills to collections

--- Verify Collection Contents ---
16. Navigate to /collections
17. Open "TS10 - My Coding Toolkit"
18. Validate that added items appear

--- Remove Item from Collection ---
19. Remove one item from the collection
20. Validate it's gone

--- Delete Collection ---
21. Navigate to /collections
22. Delete "TS10 - My Coding Toolkit"
23. Validate removal

--- Save/Unsave Public Prompt ---
24. Navigate to /discover
25. Save a public prompt (not authored by Peter)
26. Go to /library → "Saved Prompts" tab
27. Validate it appears
28. Unsave it
29. Validate removal

--- Cleanup ---
30. Delete "TS10 - Collection Prompt" and "TS10 - Collection Skill" from library
31. Log all results in your test run document.
```

---

## TS-11: Premium User Team Collaboration

**Persona:** Peter (Premium Gift) creates team, Fred (Free) joins.
**Goal:** Full team lifecycle: create, invite, switch workspace, copy artifacts, manage, delete.
**References:** TC-TEAM-001 → 005, TC-GATE-003

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Team ---
2. Navigate to /settings
3. Find Teams section
4. Click "Create Team"
5. Enter name: "TS11 - Test Team"
6. Create it
7. Validate Peter is shown as owner

--- Copy Artifact to Team ---
8. Create a prompt: "TS11 - Team Prompt", category "Business", public OFF
9. On the prompt detail page, look for "Copy to Team" option
10. Select "TS11 - Test Team"
11. Validate the copy operation

--- Switch Workspace ---
12. Find the Workspace Picker in header/sidebar
13. Validate "Personal" is selected
14. Switch to "TS11 - Test Team"
15. Validate that the library shows team-scoped content (including "TS11 - Team Prompt" copy)
16. Switch back to Personal
17. Validate personal content is shown

--- Team Settings ---
18. Switch to "TS11 - Test Team"
19. Navigate to Team Settings
20. Validate team name, GitHub sync settings, and member list are visible
21. Validate Peter is listed as owner

--- Fred Joins Team ---
22. Note the team ID from the URL or settings
23. Log in as Fred (fred@free.com / Pell@234)
24. Navigate to /settings
25. Find "Join Team" button
26. Enter the team ID
27. Validate that Fred joins "TS11 - Test Team"
28. Switch to "TS11 - Test Team" workspace
29. Validate that team content is visible

--- Team Activity ---
30. Navigate to team activity page
31. Validate that team-scoped activity events are visible

--- Cleanup ---
32. Log in as Peter
33. Navigate to Team Settings for "TS11 - Test Team"
34. Delete the team
35. Validate removal and workspace picker reverts to Personal
36. Delete "TS11 - Team Prompt" from Peter's personal library
37. Log all results in your test run document.
```

---

## TS-12: Cross-User Review & Suggestion Workflow

**Persona:** Peter (Premium) creates content, Fred (Free) reviews and suggests edits.
**Goal:** Full collaboration flow: publish → review → comment → suggest edit → owner reviews suggestion.
**References:** TC-REVIEW-001 → 003, TC-COMMENT-001/002, TC-SUGGEST-001/002

```
Execute this test scenario:

--- Setup (Peter) ---
1. Log in as Peter (peter@pro.com / Pell@234)
2. Create a public prompt: "TS12 - Collaborative Prompt", category "Writing", content: "Write a professional email about {{topic}}"
3. Validate it's public in /discover

--- Fred Reviews ---
4. Log in as Fred (fred@free.com / Pell@234)
5. Navigate to /discover → find "TS12 - Collaborative Prompt"
6. Open detail page
7. Submit a 4-star review: "TS12 - good prompt, needs more detail"
8. Validate review appears and rating updates

--- Fred Comments ---
9. Scroll to Comments section
10. Submit comment: "TS12 - could this support multiple languages?"
11. Validate comment appears

--- Fred Suggests Edit ---
12. Click "Suggest Edit"
13. Validate the Suggest Edit modal opens
14. Enter title: "Add multilingual support"
15. Enter suggested content: add "Support {{language}} for the email." to the prompt
16. Submit the suggestion
17. Validate suggestion is created with status "open"

--- Peter Reviews Suggestion ---
18. Log in as Peter
19. Navigate to "TS12 - Collaborative Prompt" detail page
20. Click "Suggestions" tab
21. Find Fred's suggestion
22. Validate Accept and Reject options are visible
23. Reject with comment: "Good idea, but out of scope for now"
24. Validate suggestion status changes to "rejected"

--- Cleanup ---
25. Log in as Fred → delete review and comment
26. Log in as Peter → delete "TS12 - Collaborative Prompt"
27. Log all results in your test run document.
```

---

## TS-13: AI Credits Consumption & Tracking

**Persona:** Peter (Premium Gift) & Alice (Admin)
**Goal:** Verify AI credit balance, consumption across features, and admin credit management.
**References:** TC-CREDITS-001/002, TC-ADMIN-004/005

```
Execute this test scenario:

--- Check Initial Balance (Peter) ---
1. Log in as Peter (peter@pro.com / Pell@234)
2. Navigate to /settings
3. Note the AI credit balance (tokens used / tokens available)

--- Consume Credits ---
4. Navigate to /prompts/new
5. Enter content and click "Suggest title, description, category & tags"
6. Wait for AI response
7. Navigate to /settings
8. Validate that credits have been deducted
9. Note the new balance

--- Use Another AI Feature ---
10. Navigate to /prompts/wizard
11. Generate a prompt
12. Navigate to /settings
13. Validate further deduction

--- Admin Views Credit Settings ---
14. Log in as Alice (alice@admin.com / Pell@234)
15. Navigate to /admin
16. Find AI Credit Settings section
17. Validate settings are visible:
    - Tokens per AI Credit
    - Free Plan – AI Credits per Month
    - Premium Plan – AI Credits per Month
    - Max Free Accounts (Signup Cap)
18. Validate each setting shows current value and Save button

--- Admin Views User Token Balances ---
19. Find User Token Balance section
20. Validate that user balances are displayed
21. Validate "Grant Tokens" action is available
22. Optionally grant tokens to Peter and verify the balance updates

23. Log all results in your test run document.
```

---

## TS-14: Admin User Management & Platform Settings

**Persona:** Alice (Admin)
**Goal:** Full admin workflow: view users, manage roles, view credits, blog access.
**References:** TC-ADMIN-001 → 006, TC-BLOG-ADMIN-003

```
Execute this test scenario:

--- Access Control ---
1. Log in as Fred (fred@free.com / Pell@234)
2. Navigate to /admin
3. Validate that access is denied or redirected
4. Log out

--- Admin Dashboard ---
5. Log in as Alice (alice@admin.com / Pell@234)
6. Navigate to /admin
7. Validate the admin dashboard loads with:
   - User management table (Avatar, Display Name, Role, Joined, Actions)
   - AI Credit Settings section
   - User Token Balance section

--- View and Verify Roles ---
8. Search for "Fred" in the user list
9. Validate Fred's role is shown as "free"
10. Search for "Peter"
11. Validate Peter's role is shown as "premium_gift"
12. Validate that a role dropdown is available
13. Validate that a "Save" button appears when a role is changed (do NOT save)

--- Delete User UI Validation ---
14. Find a user in the list
15. Validate that a Delete button (trash icon) is available
16. Click it
17. Validate that a confirmation dialog appears
18. Cancel the deletion (do NOT confirm)

--- AI Credit Settings ---
19. Scroll to AI Credit Settings
20. Validate all four settings are visible with current values
21. Do NOT change any values

--- Blog Admin Access ---
22. Navigate to /blog/admin
23. Validate that the Blog Admin Dashboard loads
24. Validate navigation to Posts, Categories, Tags, Media

--- Non-Admin Blog Access ---
25. Log in as Fred
26. Navigate to /blog/admin
27. Validate that access is denied or redirected

28. Log all results in your test run document.
```

---

## TS-15: Admin Blog CMS Lifecycle

**Persona:** Alice (Admin)
**Goal:** Full blog lifecycle: create category, create tag, create post, publish, verify public view, cleanup.
**References:** TC-BLOG-ADMIN-001 → 004, TC-BLOG-PUBLIC-001/002

```
Execute this test scenario:

1. Log in as Alice (alice@admin.com / Pell@234)

--- Create Category ---
2. Navigate to /blog/admin/categories
3. Create a category: name "TS15 - Testing", slug "ts15-testing"
4. Validate it appears in the categories list

--- Create Tag ---
5. Navigate to /blog/admin/tags
6. Create a tag: name "TS15-tag", slug "ts15-tag"
7. Validate it appears in the tags list

--- Create Draft Post ---
8. Navigate to /blog/admin/posts/new
9. Enter title: "TS15 - Test Blog Post"
10. Enter content: "This is a test blog post for scenario testing."
11. Enter excerpt: "Test post excerpt"
12. Assign category "TS15 - Testing" and tag "TS15-tag"
13. Set status to "draft"
14. Save
15. Validate the post is created

--- Publish Post ---
16. Navigate to /blog/admin/posts
17. Find "TS15 - Test Blog Post"
18. Edit it and change status to "published"
19. Set published_at date
20. Save

--- Verify Public Blog ---
21. Log out
22. Navigate to /blog
23. Validate that "TS15 - Test Blog Post" appears in the blog list
24. Click on the post
25. Validate that full content, categories, and tags are displayed

--- Filter by Category ---
26. Navigate to /blog/category/ts15-testing
27. Validate the post appears

--- Filter by Tag ---
28. Navigate to /blog/tag/ts15-tag
29. Validate the post appears

--- Cleanup ---
30. Log in as Alice
31. Delete "TS15 - Test Blog Post" from /blog/admin/posts
32. Delete "TS15 - Testing" category
33. Delete "TS15-tag" tag
34. Log all results in your test run document.
```

---

## TS-16: Public Visitor Experience (Unauthenticated)

**Persona:** Unauthenticated visitor
**Goal:** Verify all publicly accessible pages and content, and that protected routes redirect.
**References:** TC-AUTH-003, TC-DISCOVER-001 → 003, TC-BLOG-PUBLIC-001/002

```
Execute this test scenario:

1. Open a new browser session (no login)

--- Landing Page ---
2. Navigate to https://querino.ai
3. Validate that the landing page loads with:
   - Hero section with CTA
   - Features section
   - Pricing preview
   - Public prompts section
   - Footer with links

--- Discover Page ---
4. Navigate to /discover
5. Validate that public prompts, skills, workflows, and claws are visible
6. Switch between tabs and verify content loads
7. Use search and category filters

--- Pricing Page ---
8. Navigate to /pricing
9. Validate that pricing cards are displayed with feature comparison
10. Validate that CTA buttons point to /auth or contact

--- Blog ---
11. Navigate to /blog
12. Validate that published posts are visible (or empty state)
13. If posts exist, click one and validate full content renders

--- Static Pages ---
14. Navigate to /privacy → validate content loads
15. Navigate to /terms → validate content loads
16. Navigate to /cookies → validate cookie policy loads
17. Navigate to /impressum → validate impressum loads

--- Protected Route Redirect ---
18. Navigate to /library
19. Validate redirect to /auth
20. Navigate to /settings
21. Validate redirect to /auth
22. Navigate to /admin
23. Validate redirect or access denied
24. Navigate to /dashboard
25. Validate redirect to /auth

--- Cookie Banner ---
26. Validate that a cookie consent banner appears on first visit
27. Accept or dismiss the banner
28. Validate it doesn't reappear on subsequent page loads

29. Log all results in your test run document.
```

---

## TS-17: Profile & Settings Management

**Persona:** Fred (Free)
**Goal:** Edit profile, verify public profile, manage settings.
**References:** TC-PROFILE-001 → 003

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)

--- Edit Profile ---
2. Navigate to /profile/edit (or Settings → Edit Profile)
3. Update display name to: "Fred TS17 Test"
4. Update bio to: "Testing profile management"
5. Optionally add website, Twitter, GitHub handles
6. Save changes
7. Validate that a success message appears

--- Verify Public Profile ---
8. Navigate to Fred's public profile URL (/u/fred or similar)
9. Validate that display name shows "Fred TS17 Test"
10. Validate that bio shows "Testing profile management"
11. Validate that public prompts by Fred are visible
12. Validate that private prompts are NOT visible

--- View as Another User ---
13. Log out
14. Navigate to Fred's public profile
15. Validate the same public info is visible
16. Validate no edit controls are shown

--- Settings Page ---
17. Log back in as Fred
18. Navigate to /settings
19. Validate the following sections are visible:
    - Profile editing or link to edit
    - AI Credits (CreditsDisplay)
    - GitHub Sync settings
    - Teams section (with premium gate)
20. Validate that credits balance is displayed

--- Revert Profile ---
21. Navigate to /profile/edit
22. Revert display name to "Fred"
23. Clear bio
24. Save changes
25. Validate reversion

26. Log all results in your test run document.
```

---

## TS-18: Markdown Import/Export & Version History

**Persona:** Fred (Free)
**Goal:** Import a prompt from markdown, edit to create versions, compare versions, export.
**References:** TC-MARKDOWN-001/002, TC-VERSION-001/002

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)

--- Import from Markdown ---
2. Navigate to /prompts/new
3. Look for "Import from Markdown" button
4. Click it and upload a .md file containing prompt content
5. Validate that the prompt content field is populated from the file
6. Set title: "TS18 - Imported Prompt"
7. Set category: "Research"
8. Create the prompt

--- Edit to Create Versions ---
9. Open the prompt → Edit
10. Add line: "Include citations for all claims."
11. Save
12. Edit again
13. Add line: "Format output as bullet points."
14. Save

--- Version History ---
15. Navigate to Version History for this prompt
16. Validate that 3 versions exist (original import, +citations, +bullet points)
17. Click on each version to see its content
18. Use diff/compare view to compare version 1 and version 3
19. Validate that differences are highlighted

--- Export ---
20. Navigate to the prompt detail page
21. Click "Download as Markdown"
22. Validate that a .md file is downloaded with current content

--- Cleanup ---
23. Delete "TS18 - Imported Prompt"
24. Log all results in your test run document.
```

---

## TS-19: Command Palette & Navigation

**Persona:** Fred (Free)
**Goal:** Verify command palette navigation and search across the app.
**References:** TC-CMD-001

```
Execute this test scenario:

1. Log in as Fred (fred@free.com / Pell@234)

--- Open & Close ---
2. Press Cmd+K (Mac) or Ctrl+K (Windows)
3. Validate the command palette dialog opens
4. Press Escape
5. Validate the dialog closes

--- Navigation Commands ---
6. Open command palette
7. Validate navigation options: Dashboard, Library, Discover, Settings, Activity
8. Click "Dashboard"
9. Validate navigation to /dashboard

--- Create Commands ---
10. Open command palette
11. Validate create options: New Prompt, New Skill, New Workflow, New Claw
12. Click "New Prompt"
13. Validate navigation to /prompts/new

--- Search ---
14. Open command palette
15. Type a search query (e.g., "coding")
16. Validate that results are filtered based on the query
17. If results appear, click one and validate navigation

--- Search with No Results ---
18. Open command palette
19. Type a nonsense query (e.g., "xyzzy12345")
20. Validate that empty state or "no results" is shown

21. Log all results in your test run document.
```

---

## TS-20: Signup Cap Enforcement

**Persona:** Alice (Admin), new visitor
**Goal:** Verify signup cap can be configured and enforced.
**References:** TC-CAP-001/002

```
Execute this test scenario:

--- View Current Cap ---
1. Log in as Alice (alice@admin.com / Pell@234)
2. Navigate to /admin
3. Find "Max Free Accounts (Signup Cap)" in AI Credit Settings
4. Note the current value and current user count
5. Validate that both values are displayed

--- Verify Signup Form ---
6. Log out
7. Navigate to /auth?tab=signup
8. Validate that the signup form is visible and functional
9. Validate that "Sign Up" button is enabled

--- Edge Case: Cap Near Limit ---
10. (Manual/admin step) If the cap is set very close to the current user count, attempt a signup
11. Validate that if the cap is exceeded, a message like "We've reached our early access limit" is shown
12. Validate that the new account is not created or is immediately signed out

13. Log all results in your test run document.
```

---

## TS-21: GitHub Sync Configuration

**Persona:** Peter (Premium Gift)
**Goal:** Verify GitHub sync UI at personal and team level.
**References:** TC-GITHUB-001/002

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Personal GitHub Sync ---
2. Navigate to /settings
3. Find GitHub Sync section
4. Validate fields: Repository, Branch, Folder, GitHub Token
5. Validate a Sync Enable toggle is present
6. Do NOT enter real credentials

--- Library Sync Button ---
7. Navigate to /library
8. Look for "Sync to GitHub" button
9. Validate the button is present (may be disabled if not configured)

--- Team GitHub Sync ---
10. Create a team: "TS21 - Sync Team"
11. Navigate to Team Settings
12. Validate GitHub Sync fields are visible at team level
13. Validate separate repo/branch/folder fields for the team

--- Cleanup ---
14. Delete "TS21 - Sync Team"
15. Log all results in your test run document.
```

---

## TS-22: Cross-Artifact Discovery & Similar Items

**Persona:** Peter (Premium Gift)
**Goal:** Verify that similar items are shown across artifact types.
**References:** SimilarArtefactsSection component, SemanticSearch

```
Execute this test scenario:

1. Log in as Peter (peter@pro.com / Pell@234)

--- Create Related Artifacts ---
2. Create a prompt: "TS22 - Code Quality Checker", category "Coding", content about code quality, public ON
3. Create a skill: "TS22 - Code Quality Skill", content about code quality, public ON

--- Check Similar Items ---
4. Navigate to "TS22 - Code Quality Checker" prompt detail
5. Look for "Similar Items" section
6. Validate that similar artifacts are suggested (may include the skill or other coding items)

--- Semantic Search ---
7. Navigate to /discover
8. Search for "code quality"
9. Validate that both the prompt and skill appear in results across their respective tabs

--- Cleanup ---
10. Delete both artifacts
11. Log all results in your test run document.
```

---

## TS-23: Full Cleanup Scenario

**Persona:** All users
**Goal:** Ensure all test data from scenarios is removed.

```
Execute this test scenario:

--- Fred Cleanup ---
1. Log in as Fred (fred@free.com / Pell@234)
2. Navigate to /library
3. Check all tabs (My Prompts, Skills, Workflows, Claws)
4. Delete any artifacts with "TS" prefix in their title
5. Navigate to /discover and search for "TS" on all tabs
6. Validate no "TS" prefixed test artifacts remain

--- Peter Cleanup ---
7. Log in as Peter (peter@pro.com / Pell@234)
8. Navigate to /library
9. Check all tabs
10. Delete any artifacts with "TS" prefix
11. Navigate to /collections
12. Delete any "TS" prefixed collections
13. Navigate to /settings → Teams
14. Delete any "TS" prefixed teams

--- Alice Cleanup ---
15. Log in as Alice (alice@admin.com / Pell@234)
16. Navigate to /blog/admin/posts
17. Delete any "TS" prefixed blog posts
18. Navigate to /blog/admin/categories
19. Delete any "TS" prefixed categories
20. Navigate to /blog/admin/tags
21. Delete any "TS" prefixed tags

--- Final Validation ---
22. Log out
23. Navigate to /discover
24. Search for "TS" across all tabs
25. Validate zero results for test data
26. Navigate to /blog
27. Validate no "TS" prefixed posts are visible

28. Log all results in your test run document.
```

---

## Scenario Coverage Matrix

| Feature Area | Scenarios Covering It |
|---|---|
| Authentication (login/logout/signup/OAuth) | TS-01, TS-16 |
| Signup Cap | TS-20 |
| Prompt CRUD (Free) | TS-02 |
| Prompt CRUD (Premium + AI) | TS-05, TS-06 |
| Skill CRUD | TS-07 |
| Workflow CRUD | TS-08 |
| Claw CRUD | TS-09 |
| Library Management | TS-02, TS-03, TS-10 |
| Discover & Search | TS-03, TS-22 |
| Reviews & Comments | TS-03, TS-12 |
| Collections | TS-10 |
| Premium Gating | TS-04 |
| AI Credits | TS-13 |
| Prompt Wizard | TS-05 |
| Prompt Coach | TS-05, TS-06 |
| Prompt Refinement | TS-05, TS-06 |
| Send to LLM | TS-02 |
| Version History | TS-02, TS-06, TS-09, TS-18 |
| Pinning | TS-02 |
| Markdown Import/Export | TS-02, TS-18 |
| Suggestions (Suggest Edits) | TS-12 |
| Teams & Workspaces | TS-11 |
| GitHub Sync | TS-21 |
| Activity Feed | TS-11 |
| Command Palette | TS-01, TS-19 |
| Blog (Admin) | TS-14, TS-15 |
| Blog (Public) | TS-15, TS-16 |
| Admin Features | TS-13, TS-14 |
| Profile Management | TS-17 |
| Public Visitor Experience | TS-16 |
| Cookie Banner | TS-16 |
| Static Pages (Privacy/Terms/etc.) | TS-16 |
| Semantic Search / Similar Items | TS-22 |
| AI Insights | TS-07 |
| Clone / Copy Artifacts | TS-07, TS-08, TS-09 |
| Copy to Team | TS-11 |
| Cleanup | TS-23 |

---

## Execution Order

For a full regression test, execute scenarios in this order:

1. **TS-01** – Onboarding (ensures accounts exist)
2. **TS-16** – Public visitor (no auth needed)
3. **TS-02** – Free prompt lifecycle
4. **TS-03** – Free discovery & engagement
5. **TS-04** – Premium gates
6. **TS-05** – Premium AI-assisted creation
7. **TS-06** – Premium refinement & coaching
8. **TS-07** – Skill lifecycle
9. **TS-08** – Workflow lifecycle
10. **TS-09** – Claw lifecycle
11. **TS-10** – Collections & library
12. **TS-11** – Teams
13. **TS-12** – Cross-user collaboration
14. **TS-13** – AI credits
15. **TS-17** – Profile & settings
16. **TS-18** – Markdown & versions
17. **TS-19** – Command palette
18. **TS-20** – Signup cap
19. **TS-21** – GitHub sync
20. **TS-22** – Cross-artifact discovery
21. **TS-14** – Admin management
22. **TS-15** – Blog CMS
23. **TS-23** – Full cleanup
