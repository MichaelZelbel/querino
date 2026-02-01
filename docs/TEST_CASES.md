# Querino Test Cases

This document contains end-to-end test cases for Querino's core functionalities. Tests are designed to be executed in order within each section to ensure proper cleanup (create → verify → delete).

## Test Users

| User  | Email            | Plan         | Role  |
|-------|------------------|--------------|-------|
| Fred  | fred@free.com    | Free         | User  |
| Peter | peter@pro.com    | Premium Gift | User  |
| Alice | alice@admin.com  | Premium      | Admin |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Prompt Management - Free User](#2-prompt-management---free-user)
3. [Prompt Management - Premium User](#3-prompt-management---premium-user)
4. [Skill Management](#4-skill-management)
5. [Workflow Management](#5-workflow-management)
6. [Library & Discovery](#6-library--discovery)
7. [Reviews & Comments](#7-reviews--comments)
8. [Collections](#8-collections)
9. [Premium Feature Gating](#9-premium-feature-gating)
10. [Admin Features](#10-admin-features)
11. [Profile Management](#11-profile-management)
12. [Cleanup](#12-cleanup)

---

## 1. Authentication

### TC-AUTH-001: Login with Valid Credentials

```
Execute this testcase:

Use your browser to navigate to https://querino.ai
Click the "Sign In" button in the header
Enter the credentials of the test user Fred
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

---

## 2. Prompt Management - Free User

### TC-PROMPT-FREE-001: Create Private Prompt

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to the Create New Prompt page (via header menu or /prompts/new)
Validate that "Suggest title, description, category & tags" button is disabled or shows a premium indicator
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
Search for "Test Public Prompt Free User"
Validate that the prompt appears in the search results
Validate that it shows the author as Fred
Log the results of the validation in your test run document.
```

---

## 3. Prompt Management - Premium User

### TC-PROMPT-PRO-001: Create Prompt with AI Suggestions

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to the Create New Prompt page
Insert the following into "Prompt Content":
  "Analyze the provided code and suggest performance optimizations. 
   Consider time complexity, space complexity, and readability.
   Provide specific code examples for each suggestion."
Validate that the "Suggest title, description, category & tags" button is enabled (not grayed out)
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

## 4. Skill Management

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
Filter or search for Skills
Search for "Test Skill - Code Review Expert"
Validate that the skill appears in results
Validate that it shows Peter as the author
Log the results of the validation in your test run document.
```

---

## 5. Workflow Management

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

---

## 6. Library & Discovery

### TC-LIBRARY-001: Save Public Prompt to Library

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to /discover
Find a public prompt (not authored by Peter)
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
Click on the "Coding" category filter
Validate that only prompts with category "Coding" are displayed
Click on "All" or clear the filter
Validate that all prompts are displayed again
Log the results of the validation in your test run document.
```

### TC-DISCOVER-002: Search Functionality

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
Enter "Test" in the search box
Validate that search results show prompts containing "Test" in title or description
Clear the search
Validate that all prompts are displayed again
Log the results of the validation in your test run document.
```

---

## 7. Reviews & Comments

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

## 8. Collections

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

## 9. Premium Feature Gating

### TC-GATE-001: AI Suggestions Blocked for Free User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Create New Prompt
Enter some content in the Prompt Content field
Locate the "Suggest title, description, category & tags" button
Validate that the button is disabled, shows a lock icon, or indicates premium requirement
Attempt to click the button
Validate that either nothing happens or an upgrade prompt is shown
Log the results of the validation in your test run document.
```

### TC-GATE-002: AI Suggestions Available for Premium User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Peter
Navigate to Create New Prompt
Enter some content in the Prompt Content field
Locate the "Suggest title, description, category & tags" button
Validate that the button is enabled and clickable
Click the button
Validate that AI suggestions are generated
Log the results of the validation in your test run document.
```

### TC-GATE-003: Team Features Blocked for Free User

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Settings or look for Team-related features
Validate that team creation or team features show a premium requirement
Validate that attempting to access team features shows an upgrade prompt
Log the results of the validation in your test run document.
```

---

## 10. Admin Features

### TC-ADMIN-001: Access Admin Dashboard

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Validate that the admin dashboard loads successfully
Validate that you can see user management sections
Validate that you can see role management options
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

### TC-ADMIN-003: View User Roles

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Alice
Navigate to /admin
Find the user management or roles section
Search for or find user "Fred"
Validate that Fred's role is shown as "free"
Search for or find user "Peter"
Validate that Peter's role is shown as "premium_gift"
Log the results of the validation in your test run document.
```

---

## 11. Profile Management

### TC-PROFILE-001: Edit Profile

```
Execute this testcase:

Use your browser to log in at https://querino.ai with the credentials of the test user Fred
Navigate to Settings or Edit Profile
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
Navigate to Settings or Edit Profile
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

## 12. Cleanup

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

### TC-CLEANUP-005: Final Validation

```
Execute this testcase:

Use your browser to navigate to https://querino.ai/discover
Search for "Test" 
Validate that no test prompts, skills, or workflows appear in results
Log the results of the validation in your test run document.
```

---

## Test Execution Notes

### Running Tests

1. Execute tests in order within each section
2. The Cleanup section (12) should always be run last
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

### Credentials Storage

Store test user credentials securely. Never commit credentials to the repository. Use environment variables or a secure secrets manager.
