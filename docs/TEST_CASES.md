# Querino Test Cases

This document contains end-to-end test cases for Querino's core functionalities. Tests are designed to be executed in order within each section to ensure proper cleanup (create → verify → delete).

## Test Users

All test user passwords are set to `Pell@234`.

| User  | Email           | Plan         | Role  |
|-------|-----------------|--------------|-------|
| Fred  | fred@free.com   | Free         | User  |
| Peter | peter@pro.com   | Premium Gift | User  |
| Alice | alice@admin.com | Admin        | Admin |

> **Note:** As of February 2026, only fred@free.com exists. Peter and Alice must be created before their test cases can run.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Signup Cap](#2-signup-cap)
3. [Prompt Management - Free User](#3-prompt-management---free-user)
4. [Prompt Management - Premium User](#4-prompt-management---premium-user)
5. [Prompt Wizard](#5-prompt-wizard)
6. [Prompt Refinement](#6-prompt-refinement)
7. [Prompt Coach](#7-prompt-coach)
8. [Send to LLM](#8-send-to-llm)
9. [Version History](#9-version-history)
10. [Pin / Unpin Prompts](#10-pin--unpin-prompts)
11. [Skill Management](#11-skill-management)
12. [Workflow Management](#12-workflow-management)
13. [Claw Management](#13-claw-management)
14. [Library & Discovery](#14-library--discovery)
15. [Reviews & Comments](#15-reviews--comments)
16. [Collections](#16-collections)
17. [Premium Feature Gating](#17-premium-feature-gating)
18. [AI Credits](#18-ai-credits)
19. [Teams & Workspaces](#19-teams--workspaces)
20. [GitHub Sync](#20-github-sync)
21. [Activity Feed](#21-activity-feed)
22. [Suggestions (Suggest Edits)](#22-suggestions-suggest-edits)
23. [Markdown Import / Export](#23-markdown-import--export)
24. [Command Palette](#24-command-palette)
25. [Blog (Admin)](#25-blog-admin)
26. [Blog (Public)](#26-blog-public)
27. [Admin Features](#27-admin-features)
28. [Profile Management](#28-profile-management)
29. [Cleanup](#29-cleanup)

---

## 1. Authentication

### TC-AUTH-001: Login with Valid Credentials

```
Execute this testcase:

Use your browser to navigate to https://querino.ai
Click the "Sign In" button in the header
Enter the credentials of the test user Fred (fred@free.com / Pell@234)
Click "Sign In"
Validate that the user is redirected to the dashboard or home page
Validate that the header shows the user's avatar or profile menu
Log the results of the validation in your test run document.
```

### TC-AUTH-002: Logout

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Click on the user avatar/profile menu in the header
Click "Sign Out"
Validate that the user is redirected to the home page
Validate that the "Sign In" button appears in the header
Log the results of the validation in your test run document.
```

### TC-AUTH-003: Protected Route Redirect

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/library without being logged in
Validate that you are redirected to the authentication page
Validate that after logging in with Fred's credentials, you are redirected back to /library
Log the results of the validation in your test run document.
```

### TC-AUTH-004: Sign Up with Email

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/auth?tab=signup
Enter a new test email (e.g., signuptest@test.com)
Enter password: Pell@234
Click "Sign Up"
Validate that a confirmation message is shown (e.g., "Check your email")
Validate that the Supabase signUp call was made (check network tab)
Log the results of the validation in your test run document.
Note: Clean up by deleting the test account from Supabase dashboard afterward.
```

### TC-AUTH-005: OAuth Login Buttons Present

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/auth
Validate that "Continue with Google" button is present
Validate that "Continue with GitHub" button is present
Validate that clicking either redirects to the OAuth provider (do not complete login)
Log the results of the validation in your test run document.
```

---

## 2. Signup Cap

### TC-CAP-001: Signup Allowed When Under Cap

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/auth?tab=signup
Validate that the signup form is visible and functional (not showing a "signups closed" message)
Validate that the "Sign Up" button is enabled
Log the results of the validation in your test run document.
```

### TC-CAP-002: Admin Can View and Edit Signup Cap

```
Execute this testcase:

Use your browser to log in at https://querino.ai with Alice's credentials
Navigate to /admin
Find the "AI Credit & Account Settings" section
Validate that "Max Free Accounts (Signup Cap)" setting is visible
Validate that the current value and user count are displayed
Log the results of the validation in your test run document.
```

---

## 3. Prompt Management - Free User

### TC-PROMPT-FREE-001: Create Private Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to the Create New Prompt page (via header menu or /prompts/new)
Validate that "Suggest title, description, category & tags" button is visible and enabled (available to all users with AI credits)
Insert the following into "Prompt Content":
  "You are a coding assistant. Help the user write clean, efficient code in {{language}}. 
   Focus on best practices and explain your reasoning."
Enter the title: "Test Create Private Prompt Free User"
Enter the description: "A test prompt for coding assistance created by a free user"
Choose the category "Coding"
Turn OFF "Make this prompt public"
Click "Create Prompt"
Validate that you are redirected to the prompt detail page
Validate that the prompt title is "Test Create Private Prompt Free User"
Validate that the prompt is marked as private
Log the results of the validation in your test run document.
```

### TC-PROMPT-FREE-002: Verify Private Prompt in Library

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to "My Library" (/library)
Click on the "My Prompts" tab
Validate that "Test Create Private Prompt Free User" appears in the list
Validate that it shows a private/lock indicator
Log the results of the validation in your test run document.
```

### TC-PROMPT-FREE-003: Edit Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to "My Library" (/library)
Click on the "My Prompts" tab
Click on "Test Create Private Prompt Free User"
Click the "Edit" button
Change the title to "Test Create Private Prompt Free User - Edited"
Change the description to "Updated description for testing"
Click "Save Changes"
Validate that the changes are saved
Validate that the title now shows "Test Create Private Prompt Free User - Edited"
Log the results of the validation in your test run document.
```

### TC-PROMPT-FREE-004: Create Public Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to the Create New Prompt page
Insert the following into "Prompt Content":
  "Write a professional email about {{topic}}. Keep it concise and friendly."
Enter the title: "Test Public Prompt Free User"
Enter the description: "A public test prompt for email writing"
Choose the category "Writing"
Ensure "Make this prompt public" is turned ON
Click "Create Prompt"
Validate that you are redirected to the prompt detail page
Validate that the prompt is marked as public
Log the results of the validation in your test run document.
```

### TC-PROMPT-FREE-005: Verify Public Prompt in Discover

```
Execute this testcase:

Use your browser to log out if logged in
Navigate to https://querino.ai/discover
On the Prompts tab, search for "Test Public Prompt Free User"
Validate that the prompt appears in the search results
Validate that it shows the author as Fred
Log the results of the validation in your test run document.
```

---

## 4. Prompt Management - Premium User

### TC-PROMPT-PRO-001: Create Prompt with AI Suggestions

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to the Create New Prompt page
Insert the following into "Prompt Content":
  "Analyze the provided code and suggest performance optimizations. 
   Consider time complexity, space complexity, and readability.
   Provide specific code examples for each suggestion."
Validate that the "Suggest title, description, category & tags" button is enabled (available to all users with AI credits)
Click "Suggest title, description, category & tags"
Validate that AI-generated suggestions appear for title, description, category, and tags
Accept or modify the suggestions as needed
Set the title to: "Test Premium AI Suggestions Prompt"
Turn ON "Make this prompt public"
Click "Create Prompt"
Validate that the prompt is created successfully
Log the results of the validation in your test run document.
```

### TC-PROMPT-PRO-002: Clone Public Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover
Find and click on "Test Public Prompt Free User" (created by Fred)
Click the "Clone" or "Copy to Library" button
Validate that a copy of the prompt is created
Navigate to My Library
Validate that the cloned prompt appears in "My Prompts"
Validate that the cloned prompt has Peter as the author
Log the results of the validation in your test run document.
```

### TC-PROMPT-PRO-003: Delete Cloned Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library (/library)
Find the cloned prompt "Test Public Prompt Free User" (or similar name)
Click on the prompt to open details
Click the "Delete" button
Confirm the deletion
Validate that the prompt is removed from the library
Log the results of the validation in your test run document.
```

---

## 5. Prompt Wizard

### TC-WIZARD-001: Generate Prompt via Wizard (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /prompts/wizard
Validate that the Prompt Wizard page loads with input fields for:
  - Goal / task description
  - Target LLM (ChatGPT, Claude, Gemini, Other)
  - Framework selection
Describe a goal (e.g., "Write a blog post about sustainable living")
Select a target LLM (e.g., "ChatGPT")
Select a framework if available
Click "Generate Prompt"
Validate that a generated prompt appears in the output area
Validate that you can copy the generated prompt
Validate that you can navigate to create a new prompt from the result
Log the results of the validation in your test run document.
```

### TC-WIZARD-002: Wizard Blocked for Free User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /prompts/wizard
Validate that the wizard either blocks usage with a premium indicator or
  the "Generate" button is disabled/shows a lock icon
Log the results of the validation in your test run document.
```

---

## 6. Prompt Refinement

### TC-REFINE-001: Refine Prompt (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to a prompt detail page (e.g., "Test Premium AI Suggestions Prompt")
Click the "Refine" button
Validate that the Refine Prompt modal opens
Validate that the current prompt content is shown
Optionally select a framework and enter a goal
Click "Refine"
Validate that a refined version of the prompt is generated
Validate that you can apply the refined prompt or copy it
Close the modal
Log the results of the validation in your test run document.
```

---

## 7. Prompt Coach

### TC-COACH-001: Use Prompt Coach Panel (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Create New Prompt (/prompts/new)
Look for the Prompt Coach panel (sidebar or sheet button labeled "Coach")
Open the Prompt Coach panel
Validate that quick action buttons are visible (e.g., "Make clearer", "Shorten", "Add examples")
Enter some content in the prompt editor
Click one of the quick actions (e.g., "Make clearer")
Validate that the coach responds with a suggestion
Validate that the suggestion can be applied to the prompt content
Log the results of the validation in your test run document.
```

---

## 8. Send to LLM

### TC-SEND-LLM-001: Send Prompt to External LLM

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to a public prompt detail page
Look for the "Send to LLM" button (or dropdown)
Click the dropdown to see LLM options (ChatGPT, Claude, Gemini)
Click one of the LLM options
Validate that a new tab/window opens with the selected LLM service
Validate that the prompt content is passed (may be in clipboard or URL)
Log the results of the validation in your test run document.
```

---

## 9. Version History

### TC-VERSION-001: Create Version on Edit

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to My Library (/library)
Open "Test Create Private Prompt Free User - Edited"
Click "Edit"
Change the prompt content by adding a new line: "Always provide unit tests."
Click "Save Changes"
Navigate to the prompt's Version History (via versions link or /library/<slug>/versions)
Validate that at least 2 versions are listed
Validate that the latest version contains the new content
Log the results of the validation in your test run document.
```

### TC-VERSION-002: Compare Versions

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to the Version History page for the edited prompt
Select two versions to compare (if compare/diff view is available)
Validate that the differences between versions are highlighted
Log the results of the validation in your test run document.
```

---

## 10. Pin / Unpin Prompts

### TC-PIN-001: Pin Prompt to Dashboard

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to My Library (/library)
Find a prompt in "My Prompts"
Click the Pin icon on the prompt card
Navigate to /dashboard
Validate that the pinned prompt appears in the "Pinned Prompts" section
Log the results of the validation in your test run document.
```

### TC-PIN-002: Unpin Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /dashboard
Find the pinned prompt
Click the Unpin icon
Validate that the prompt is removed from the "Pinned Prompts" section
Log the results of the validation in your test run document.
```

---

## 11. Skill Management

### TC-SKILL-001: Create Private Skill

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Create New Skill (via header menu or /skills/new)
Enter the title: "Test Skill - Code Review Expert"
Enter the description: "A skill for conducting thorough code reviews"
Insert the following into "Skill Content":
  "# Code Review Expert
   
   ## Role
   You are an expert code reviewer with 20 years of experience.
   
   ## Approach
   - Check for security vulnerabilities
   - Evaluate code readability
   - Suggest performance improvements
   - Verify error handling"
Choose a category if available
Leave "Make this skill public" turned OFF
Click "Create Skill"
Validate that the skill is created successfully
Validate that it appears in My Library under Skills
Log the results of the validation in your test run document.
```

### TC-SKILL-002: Edit and Publish Skill

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on the "Skills" tab
Find and click on "Test Skill - Code Review Expert"
Click "Edit"
Add to the description: " - Updated for testing"
Turn ON "Make this skill public"
Click "Save Changes"
Validate that the skill is now public
Log the results of the validation in your test run document.
```

### TC-SKILL-003: Verify Public Skill Visibility

```
Execute this testcase:

Use your browser to log out
Navigate to https://querino.ai/discover
Click the "Skills" tab
Search for "Test Skill - Code Review Expert"
Validate that the skill appears in results
Validate that it shows Peter as the author
Log the results of the validation in your test run document.
```

---

## 12. Workflow Management

### TC-WORKFLOW-001: Create Private Workflow

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Create New Workflow (via header menu or /workflows/new)
Enter the title: "Test Workflow - Content Pipeline"
Enter the description: "A test workflow for content processing"
If there's a JSON editor, enter a minimal valid workflow JSON:
  {"nodes": [], "connections": []}
Choose a category if available
Leave "Make this workflow public" turned OFF
Click "Create Workflow"
Validate that the workflow is created successfully
Validate that it appears in My Library under Workflows
Log the results of the validation in your test run document.
```

### TC-WORKFLOW-002: Edit and Publish Workflow

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on the "Workflows" tab
Find and click on "Test Workflow - Content Pipeline"
Click "Edit"
Update the description: "Updated test workflow for content processing"
Turn ON "Make this workflow public"
Click "Save Changes"
Validate that the workflow is now public
Log the results of the validation in your test run document.
```

### TC-WORKFLOW-003: Verify Public Workflow Visibility

```
Execute this testcase:

Use your browser to log out
Navigate to https://querino.ai/discover
Click the "Workflows" tab
Search for "Test Workflow - Content Pipeline"
Validate that the workflow appears in results
Log the results of the validation in your test run document.
```

---

## 13. Claw Management

### TC-CLAW-001: Create Private Claw

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Create New Claw (via header menu or /claws/new)
Enter the title: "Test Claw - Web Scraper"
Enter the description: "A test claw for web scraping capabilities"
Insert the following into "Claw Content":
  "# Web Scraper Claw
   
   ## Purpose
   Extract structured data from web pages.
   
   ## Capabilities
   - Parse HTML content
   - Extract text and links
   - Handle pagination
   - Rate limiting support"
Choose a category if available
Add tags: "scraping", "automation"
Leave "Make this claw public" turned OFF
Click "Create Claw"
Validate that the claw is created successfully
Validate that it appears in My Library under Claws
Log the results of the validation in your test run document.
```

### TC-CLAW-002: Edit and Publish Claw

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on the "Claws" tab
Find and click on "Test Claw - Web Scraper"
Click "Edit"
Add to the description: " - Updated for testing"
Turn ON "Make this claw public"
Click "Save Changes"
Validate that the claw is now public
Log the results of the validation in your test run document.
```

### TC-CLAW-003: Verify Public Claw Visibility

```
Execute this testcase:

Use your browser to log out
Navigate to https://querino.ai/discover
Click the "Claws" tab
Search for "Test Claw - Web Scraper"
Validate that the claw appears in results
Validate that it shows Peter as the author
Validate that the amber/gold Claw badge is displayed
Log the results of the validation in your test run document.
```

### TC-CLAW-004: Clone Public Claw

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /discover
Click the "Claws" tab
Find and click on "Test Claw - Web Scraper" (created by Peter)
Click the "Clone" button
Validate that a copy of the claw is created
Navigate to My Library
Click on "Claws" tab
Validate that the cloned claw appears in the list
Validate that the cloned claw has Fred as the author
Log the results of the validation in your test run document.
```

### TC-CLAW-005: Add Review to Claw

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /discover
Click the "Claws" tab
Find "Test Claw - Web Scraper" (created by Peter)
Click to open the claw details
Scroll to the Reviews section
Click to add a review
Select a 4-star rating
Enter comment: "Test review - useful claw for scraping"
Submit the review
Validate that the review appears in the reviews section
Validate that the average rating is updated
Log the results of the validation in your test run document.
```

### TC-CLAW-006: AI Insights for Claw (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "Claws" tab
Click on "Test Claw - Web Scraper"
Look for the AI Insights panel (sidebar)
If no insights exist, click "Generate Insights"
Validate that AI-generated insights appear (summary, tags, recommendations)
Validate that the quality assessment is displayed
Log the results of the validation in your test run document.
```

### TC-CLAW-007: Delete Cloned Claw (Fred)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to My Library
Click on "Claws" tab
Find the cloned "Test Claw - Web Scraper"
Click on it to open details
Click "Delete"
Confirm deletion
Validate that the claw is removed from the library
Log the results of the validation in your test run document.
```

### TC-CLAW-008: Delete Review on Claw (Fred)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to "Test Claw - Web Scraper" (Peter's original) via /discover > Claws tab
Find your previously submitted review
Click "Delete"
Confirm the deletion
Validate that the review is removed
Log the results of the validation in your test run document.
```

---

## 14. Library & Discovery

### TC-LIBRARY-001: Save Public Prompt to Library

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover
On the Prompts tab, find a public prompt (not authored by Peter)
Click the "Save" or bookmark button
Navigate to My Library
Click on "Saved Prompts" tab
Validate that the saved prompt appears in the list
Log the results of the validation in your test run document.
```

### TC-LIBRARY-002: Unsave Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "Saved Prompts" tab
Find the previously saved prompt
Click the "Unsave" or bookmark button to remove it
Validate that the prompt is removed from saved prompts
Log the results of the validation in your test run document.
```

### TC-DISCOVER-001: Filter by Category

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
On the Prompts tab, click on the "Coding" category filter
Validate that only prompts with category "Coding" are displayed
Click on "All" or clear the filter
Validate that all prompts are displayed again
Log the results of the validation in your test run document.
```

### TC-DISCOVER-002: Search Functionality

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
On the Prompts tab, enter "Test" in the search box
Validate that search results show prompts containing "Test" in title or description
Clear the search
Validate that all prompts are displayed again
Log the results of the validation in your test run document.
```

### TC-DISCOVER-003: Discover Tab Navigation

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
Validate that four tabs are visible: Prompts, Skills, Workflows, Claws
Click on the "Skills" tab
Validate that published skills are displayed (or empty state if none)
Click on the "Workflows" tab
Validate that published workflows are displayed (or empty state if none)
Click on the "Claws" tab
Validate that published claws are displayed with amber/gold badge
Validate that each tab has its own search input
Log the results of the validation in your test run document.
```

### TC-DISCOVER-004: Search Skills in Discover

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
Click on the "Skills" tab
Enter "Code Review" in the search box
Validate that "Test Skill - Code Review Expert" appears in results (if published)
Log the results of the validation in your test run document.
```

---

## 15. Reviews & Comments

### TC-REVIEW-001: Add Review to Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover
Find "Test Public Prompt Free User" (created by Fred)
Click to open the prompt details
Scroll to the Reviews section
Click to add a review
Select a 4-star rating
Enter comment: "Test review - helpful prompt for email writing"
Submit the review
Validate that the review appears in the reviews section
Validate that the average rating is updated
Log the results of the validation in your test run document.
```

### TC-REVIEW-002: Edit Review

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to "Test Public Prompt Free User"
Find your previously submitted review
Click "Edit"
Change the rating to 5 stars
Update the comment to: "Test review - updated to 5 stars"
Save the changes
Validate that the updated review is displayed
Log the results of the validation in your test run document.
```

### TC-REVIEW-003: Delete Review

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to "Test Public Prompt Free User"
Find your previously submitted review
Click "Delete" 
Confirm the deletion
Validate that the review is removed
Log the results of the validation in your test run document.
```

### TC-COMMENT-001: Add Comment to Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to "Test Public Prompt Free User"
Scroll to the Comments section
Enter comment: "Test comment - great prompt!"
Submit the comment
Validate that the comment appears in the comments section
Log the results of the validation in your test run document.
```

### TC-COMMENT-002: Delete Comment

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to "Test Public Prompt Free User"
Find your previously submitted comment
Click "Delete"
Confirm the deletion
Validate that the comment is removed
Log the results of the validation in your test run document.
```

---

## 16. Collections

### TC-COLLECTION-001: Create Collection

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Collections (/collections)
Click "Create Collection" or "New Collection"
Enter title: "Test Collection - Coding Prompts"
Enter description: "A test collection for coding-related prompts"
Leave visibility as private
Click "Create"
Validate that the collection is created
Validate that it appears in the collections list
Log the results of the validation in your test run document.
```

### TC-COLLECTION-002: Add Item to Collection

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover
Find "Test Public Prompt Free User"
Click "Add to Collection" button (or similar)
Select "Test Collection - Coding Prompts"
Confirm adding
Navigate to Collections
Open "Test Collection - Coding Prompts"
Validate that the prompt appears in the collection
Log the results of the validation in your test run document.
```

### TC-COLLECTION-003: Remove Item from Collection

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Collections
Open "Test Collection - Coding Prompts"
Find "Test Public Prompt Free User" in the collection
Click "Remove" or the remove button
Confirm removal
Validate that the prompt is no longer in the collection
Log the results of the validation in your test run document.
```

### TC-COLLECTION-004: Delete Collection

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Collections
Find "Test Collection - Coding Prompts"
Click "Delete" or the delete button
Confirm deletion
Validate that the collection is removed from the list
Log the results of the validation in your test run document.
```

---

## 17. Premium Feature Gating

### TC-GATE-001: AI Suggestions Available to All Users with Credits

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Create New Prompt
Enter some content in the Prompt Content field
Locate the "Suggest title, description, category & tags" button
Validate that the button is enabled and clickable (no lock icon, no premium indicator)
Click the button
Validate that AI suggestions are generated (if Fred has AI credits remaining)
If Fred has no AI credits, validate that a toast error appears: "You've used all your AI Credits"
Log the results of the validation in your test run document.
```

### TC-GATE-003: Team Features Blocked for Free User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Settings (/settings)
Locate the Teams section
Validate that team creation or team features show a premium requirement (lock icon or PremiumGate)
Validate that attempting to access team features shows a "Contact Support" or upgrade prompt
Log the results of the validation in your test run document.
```

### TC-GATE-004: PremiumGate Component Renders Correctly

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to features gated behind PremiumGate (e.g., AI Insights panel, Prompt Coach)
Validate that a lock icon with "Premium Feature" message is displayed
Validate that a "Contact Support" button/link is shown (pointing to support@querino.ai)
Validate that the gated content is NOT visible behind the gate
Log the results of the validation in your test run document.
```

---

## 18. AI Credits

### TC-CREDITS-001: View AI Credits Balance

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /settings
Locate the AI Credits section (CreditsDisplay component)
Validate that the current credit balance is displayed
Validate that usage information is shown (tokens used / tokens available)
Log the results of the validation in your test run document.
```

### TC-CREDITS-002: Credits Deducted After AI Feature Use (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /settings and note the current credit balance
Navigate to Create New Prompt
Enter content and use "Suggest title, description, category & tags"
Navigate back to /settings
Validate that credits have been deducted from the balance
Log the results of the validation in your test run document.
```

---

## 19. Teams & Workspaces

### TC-TEAM-001: Create Team (Premium)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /settings
Find the Teams section
Click "Create Team" (or similar)
Enter team name: "Test Team"
Click Create
Validate that the team is created
Validate that Peter is shown as the team owner
Log the results of the validation in your test run document.
```

### TC-TEAM-002: Switch Workspace

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Look for the Workspace Picker in the header or sidebar
Validate that "Personal" workspace is selected by default
Switch to "Test Team" workspace
Validate that the library now shows team-scoped content
Switch back to "Personal" workspace
Validate that personal content is shown again
Log the results of the validation in your test run document.
```

### TC-TEAM-003: Team Settings

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Switch to "Test Team" workspace
Navigate to Team Settings (/team/<id>/settings)
Validate that team name, GitHub sync settings, and member list are visible
Validate that team owner can edit settings
Log the results of the validation in your test run document.
```

### TC-TEAM-004: Join Team via Code

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /settings
Find the "Join Team" button
Enter an invalid team code
Validate that an error message is shown
Log the results of the validation in your test run document.
Note: Full join flow requires a valid team invite code from Peter's team.
```

### TC-TEAM-005: Delete Test Team (Cleanup)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Team Settings for "Test Team"
Delete the team
Validate that the team is removed
Validate that the workspace picker reverts to Personal
Log the results of the validation in your test run document.
```

---

## 20. GitHub Sync

### TC-GITHUB-001: View GitHub Sync Settings

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /settings
Locate the GitHub Sync section
Validate that fields for Repository, Branch, Folder, and GitHub Token are visible
Validate that a Sync Enable toggle is present
Log the results of the validation in your test run document.
Note: Do not enter real credentials. Only validate UI presence.
```

### TC-GITHUB-002: GitHub Sync Button in Library

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library (/library)
Look for a "Sync to GitHub" button
Validate that the button is present (may be disabled if sync is not configured)
Log the results of the validation in your test run document.
```

---

## 21. Activity Feed

### TC-ACTIVITY-001: View Personal Activity

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /activity
Validate that the activity feed loads
Validate that recent actions (e.g., prompt created, prompt edited) are listed
Validate that each activity event shows a timestamp and action description
Log the results of the validation in your test run document.
```

### TC-ACTIVITY-002: View User Public Activity

```
Execute this testcase:

Use your browser to navigate to Fred's public profile (/u/fred or similar)
Click on "Activity" tab or navigate to /u/fred/activity
Validate that public activity events are visible (e.g., published prompts)
Validate that private actions are NOT shown
Log the results of the validation in your test run document.
```

---

## 22. Suggestions (Suggest Edits)

### TC-SUGGEST-001: Submit Edit Suggestion

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover and find "Test Public Prompt Free User" (by Fred)
Click "Suggest Edit" (or similar button)
Validate that the Suggest Edit modal opens
Enter a title: "Fix typo in prompt"
Enter suggested content changes
Submit the suggestion
Validate that the suggestion is created with status "open"
Log the results of the validation in your test run document.
```

### TC-SUGGEST-002: Review Suggestion as Owner

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to "Test Public Prompt Free User" prompt detail page
Click on the "Suggestions" tab
Find the suggestion from Peter
Validate that options to Accept or Reject are visible
Reject the suggestion with comment: "Not applicable for testing"
Validate that the suggestion status changes to "rejected"
Log the results of the validation in your test run document.
```

---

## 23. Markdown Import / Export

### TC-MARKDOWN-001: Download Prompt as Markdown

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to a prompt detail page
Look for a "Download as Markdown" button
Click the button
Validate that a .md file is downloaded containing the prompt content
Log the results of the validation in your test run document.
```

### TC-MARKDOWN-002: Import Prompt from Markdown

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Create New Prompt (/prompts/new)
Look for an "Import from Markdown" button
Click it and upload a .md file
Validate that the prompt content is populated from the file
Log the results of the validation in your test run document.
```

---

## 24. Command Palette

### TC-CMD-001: Open Command Palette

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Press Cmd+K (Mac) or Ctrl+K (Windows)
Validate that the command palette dialog opens
Validate that it shows navigation options (Dashboard, Library, Discover, etc.)
Validate that it shows "Create" options (New Prompt, New Skill, New Workflow, New Claw)
Type a search query
Validate that results are filtered based on the query
Press Escape to close
Validate that the dialog closes
Log the results of the validation in your test run document.
```

---

## 25. Blog (Admin)

### TC-BLOG-ADMIN-001: Access Blog Admin Dashboard

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /blog/admin
Validate that the Blog Admin Dashboard loads
Validate that navigation to Posts, Categories, Tags, and Media is available
Log the results of the validation in your test run document.
```

### TC-BLOG-ADMIN-002: Create Blog Post

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /blog/admin/posts/new
Enter title: "Test Blog Post"
Enter content: "This is a test blog post for end-to-end testing."
Enter excerpt: "Test post excerpt"
Set status to "draft"
Click Save
Validate that the post is created successfully
Log the results of the validation in your test run document.
```

### TC-BLOG-ADMIN-003: Blog Admin Blocked for Non-Admin

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /blog/admin
Validate that access is denied or the page redirects
Log the results of the validation in your test run document.
```

### TC-BLOG-ADMIN-004: Delete Test Blog Post (Cleanup)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /blog/admin/posts
Find "Test Blog Post"
Delete it
Validate that the post is removed
Log the results of the validation in your test run document.
```

---

## 26. Blog (Public)

### TC-BLOG-PUBLIC-001: View Blog List

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/blog (no login required)
Validate that the blog list page loads
Validate that published blog posts are displayed (or empty state if none)
Validate that each post shows title, excerpt, and date
Log the results of the validation in your test run document.
```

### TC-BLOG-PUBLIC-002: View Blog Post

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/blog
Click on a published blog post (if any exist)
Validate that the full post content is displayed
Validate that categories and tags are shown
Log the results of the validation in your test run document.
```

---

## 27. Admin Features

### TC-ADMIN-001: Access Admin Dashboard

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Validate that the admin dashboard loads successfully
Validate that you can see the user management table with columns: Avatar, Display Name, Role, Joined, Actions
Validate that AI Credit Settings section is visible
Validate that User Token Balance section is visible
Log the results of the validation in your test run document.
```

### TC-ADMIN-002: Admin Cannot Access as Regular User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /admin
Validate that access is denied or redirected
Validate that admin features are not visible
Log the results of the validation in your test run document.
```

### TC-ADMIN-003: View and Edit User Roles

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Search for "Fred" in the user search
Validate that Fred's role is shown as "free"
Search for "Peter"
Validate that Peter's role is shown as "premium_gift"
Validate that a role dropdown is available to change user roles
Validate that a "Save" button appears when a role is changed (do NOT actually save)
Log the results of the validation in your test run document.
```

### TC-ADMIN-004: View AI Credit Settings

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Find the AI Credit Settings section
Validate that the following settings are visible:
  - Tokens per AI Credit
  - Free Plan – AI Credits per Month
  - Premium Plan – AI Credits per Month
  - Max Free Accounts (Signup Cap)
Validate that each setting shows its current value and a Save button
Log the results of the validation in your test run document.
```

### TC-ADMIN-005: View User Token Balances

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Find the User Token Balance section
Validate that user token balances are displayed
Validate that a "Grant Tokens" action is available for each user
Log the results of the validation in your test run document.
```

### TC-ADMIN-006: Delete User (Admin Only)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Find a test user in the user list
Validate that a Delete button (trash icon) is available
Validate that clicking it shows a confirmation dialog
Do NOT confirm the deletion (cancel)
Log the results of the validation in your test run document.
```

---

## 28. Profile Management

### TC-PROFILE-001: Edit Profile

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /profile/edit (or Settings > Edit Profile)
Update display name to: "Fred Test User"
Update bio to: "Testing profile updates"
Save changes
Navigate to your public profile
Validate that the display name shows "Fred Test User"
Validate that the bio shows "Testing profile updates"
Log the results of the validation in your test run document.
```

### TC-PROFILE-002: Revert Profile Changes

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to /profile/edit
Revert display name to original (or "Fred")
Clear or update bio to original value
Save changes
Validate that the profile is reverted
Log the results of the validation in your test run document.
```

### TC-PROFILE-003: View Public Profile

```
Execute this testcase:

Use your browser (logged out or as different user)
Navigate to Fred's public profile URL (/u/fred or similar)
Validate that public prompts by Fred are visible
Validate that private prompts are NOT visible
Validate that basic profile info is displayed
Log the results of the validation in your test run document.
```

---

## 29. Cleanup

These test cases clean up all test data created during the test run.

### TC-CLEANUP-001: Delete Test Prompts (Fred)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to My Library
Click on "My Prompts" tab
Find and delete "Test Create Private Prompt Free User - Edited"
Find and delete "Test Public Prompt Free User"
Validate that both prompts are removed
Log the results of the validation in your test run document.
```

### TC-CLEANUP-002: Delete Test Prompt (Peter)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "My Prompts" tab
Find and delete "Test Premium AI Suggestions Prompt"
Validate that the prompt is removed
Log the results of the validation in your test run document.
```

### TC-CLEANUP-003: Delete Test Skill (Peter)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "Skills" tab
Find and delete "Test Skill - Code Review Expert"
Validate that the skill is removed
Log the results of the validation in your test run document.
```

### TC-CLEANUP-004: Delete Test Workflow (Peter)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "Workflows" tab
Find and delete "Test Workflow - Content Pipeline"
Validate that the workflow is removed
Log the results of the validation in your test run document.
```

### TC-CLEANUP-005: Delete Test Claw (Peter)

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to My Library
Click on "Claws" tab
Find and delete "Test Claw - Web Scraper"
Validate that the claw is removed
Log the results of the validation in your test run document.
```

### TC-CLEANUP-006: Final Validation

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
Search for "Test" on each tab (Prompts, Skills, Workflows, Claws)
Validate that no test prompts, skills, workflows, or claws appear in results
Log the results of the validation in your test run document.
```

---

## Test Execution Notes

### Running Tests

1. Execute tests in order within each section
2. The Cleanup section (29) should always be run last
3. Log all validation results and any failures
4. Take screenshots of failures for debugging

### Expected Test Data Created

| Item | Type | Author | Visibility | Cleanup Test |
|------|------|--------|------------|--------------|
| Test Create Private Prompt Free User - Edited | Prompt | Fred | Private | TC-CLEANUP-001 |
| Test Public Prompt Free User | Prompt | Fred | Public | TC-CLEANUP-001 |
| Test Premium AI Suggestions Prompt | Prompt | Peter | Public | TC-CLEANUP-002 |
| Test Skill - Code Review Expert | Skill | Peter | Public | TC-CLEANUP-003 |
| Test Workflow - Content Pipeline | Workflow | Peter | Public | TC-CLEANUP-004 |
| Test Claw - Web Scraper | Claw | Peter | Public | TC-CLEANUP-005 |
| Test Team | Team | Peter | N/A | TC-TEAM-005 |
| Test Blog Post | Blog Post | Alice | Draft | TC-BLOG-ADMIN-004 |

### Credentials

All test users use the password `Pell@234`. See the Test Users table at the top for emails.
