# Test Cases Document Generation Prompt

Use the following prompt template to generate a comprehensive `TEST_CASES.md` document for any SaaS project. Replace all bracketed placeholders with your project-specific values.

---

## Prompt Template

```
Create a comprehensive TEST_CASES.md document for end-to-end browser-based testing of [APP_NAME], a [APP_DESCRIPTION].

## Project Context
- App URL: [APP_URL]
- Primary entities: [PRIMARY_ENTITY], [SECONDARY_ENTITY], [TERTIARY_ENTITY] (if applicable)
- User roles: Free, Premium, Admin
- Key features: [LIST_KEY_FEATURES]

## Test Users
Define three test personas:
1. **Free User**: [FREE_USER_EMAIL] - Tests free tier limitations
2. **Premium User**: [PREMIUM_USER_EMAIL] - Tests premium features
3. **Admin User**: [ADMIN_USER_EMAIL] - Tests admin functionality

## Required Test Sections

### Section 1: Authentication & Onboarding
- TC-AUTH-001: Email/password signup with email verification
- TC-AUTH-002: Login with valid credentials
- TC-AUTH-003: Password reset flow
- TC-AUTH-004: Logout functionality
- TC-AUTH-005: OAuth login (if applicable: Google, GitHub, etc.)

### Section 2: [PRIMARY_ENTITY] Management
- TC-[PREFIX]-001: Create new [PRIMARY_ENTITY] (private/draft)
- TC-[PREFIX]-002: Edit [PRIMARY_ENTITY] with all fields
- TC-[PREFIX]-003: Publish/make public
- TC-[PREFIX]-004: Verify public visibility (logged out)
- TC-[PREFIX]-005: Clone/fork [PRIMARY_ENTITY]
- TC-[PREFIX]-006: Delete [PRIMARY_ENTITY]

### Section 3: [SECONDARY_ENTITY] Management
(Same pattern as Section 2)

### Section 4: [TERTIARY_ENTITY] Management
(Same pattern as Section 2, if applicable)

### Section 5: Library & Discovery
- TC-LIB-001: View personal library with filters
- TC-LIB-002: Search functionality with keywords
- TC-LIB-003: Category/tag filtering
- TC-LIB-004: Sort by date, rating, popularity
- TC-LIB-005: Pagination behavior

### Section 6: Reviews & Ratings
- TC-REV-001: Submit review with star rating and comment
- TC-REV-002: Edit own review
- TC-REV-003: Delete own review
- TC-REV-004: Verify rating aggregation updates
- TC-REV-005: Prevent duplicate reviews from same user

### Section 7: Comments/Discussion (if applicable)
- TC-COM-001: Add comment to [ENTITY]
- TC-COM-002: Reply to existing comment (threaded)
- TC-COM-003: Edit own comment
- TC-COM-004: Delete own comment

### Section 8: Premium Feature Gating
- TC-PREM-001: Free user sees upgrade prompts for premium features
- TC-PREM-002: Premium user accesses gated features
- TC-PREM-003: Premium badge displays correctly
- TC-PREM-004: Upsell modal appears at appropriate triggers

### Section 9: Subscription & Billing (if applicable)
- TC-SUB-001: View current plan details
- TC-SUB-002: Initiate upgrade flow
- TC-SUB-003: Access billing portal
- TC-SUB-004: Verify plan change reflects in UI

### Section 10: Admin Features
- TC-ADMIN-001: Access admin dashboard
- TC-ADMIN-002: View all users list
- TC-ADMIN-003: Modify user roles/permissions
- TC-ADMIN-004: View platform analytics
- TC-ADMIN-005: Manage global settings

### Section 11: Profile & Settings
- TC-PROF-001: View own profile
- TC-PROF-002: Edit display name and bio
- TC-PROF-003: Upload/change avatar
- TC-PROF-004: Update notification preferences
- TC-PROF-005: View public profile as other user

### Section 12: Teams/Workspaces (if applicable)
- TC-TEAM-001: Create new team
- TC-TEAM-002: Invite member to team
- TC-TEAM-003: Accept team invitation
- TC-TEAM-004: Change member role
- TC-TEAM-005: Remove member from team
- TC-TEAM-006: Transfer [ENTITY] to team

### Section 13: AI Features (if applicable)
- TC-AI-001: Trigger AI generation feature
- TC-AI-002: Verify credit/token deduction
- TC-AI-003: View remaining credits
- TC-AI-004: Handle insufficient credits gracefully

### Section 14: Cleanup & Validation
- TC-CLEANUP-001 through TC-CLEANUP-00X: Delete all test entities created
- TC-CLEANUP-FINAL: Verify global search returns no test data

## Test Case Format

Each test case must follow this structure:

### TC-[SECTION]-00X: [Action Description]
**Preconditions:** [Required state before test]
**User:** [Which test user persona]

1. Navigate to [specific URL or UI element]
2. [Step-by-step browser instructions]
3. [Include specific form values, button labels]
4. Validate that [expected outcome with specific assertions]

**Expected Result:** [Clear success criteria]

## Expected Test Data Table

Include a summary table of all test artifacts created:

| Entity Type | Name | Owner | Visibility | Created In |
|-------------|------|-------|------------|------------|
| [TYPE] | [NAME] | [USER] | [PUBLIC/PRIVATE] | [TC-XXX-00X] |

## Additional Requirements

1. All test cases must be executable via browser automation
2. Include explicit wait/validation steps between actions
3. Test both happy path and key error states
4. Verify responsive behavior for critical flows
5. Include accessibility checks where relevant
6. Document any test data dependencies between sections
```

---

## Placeholder Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[APP_NAME]` | Your application name | "PromptHub" |
| `[APP_DESCRIPTION]` | Brief app description | "prompt management and sharing platform" |
| `[APP_URL]` | Production or staging URL | "https://app.example.com" |
| `[PRIMARY_ENTITY]` | Main content type | "Prompt", "Document", "Project" |
| `[SECONDARY_ENTITY]` | Secondary content type | "Skill", "Template", "Workflow" |
| `[TERTIARY_ENTITY]` | Third content type (if any) | "Claw", "Collection" |
| `[PREFIX]` | Short prefix for test IDs | "PROMPT", "DOC", "PROJ" |
| `[FREE_USER_EMAIL]` | Test email for free user | "test-free@example.com" |
| `[PREMIUM_USER_EMAIL]` | Test email for premium user | "test-premium@example.com" |
| `[ADMIN_USER_EMAIL]` | Test email for admin user | "test-admin@example.com" |
| `[LIST_KEY_FEATURES]` | Comma-separated features | "AI generation, team collaboration, version history" |

---

## Usage Tips

1. **Customize sections**: Remove sections that don't apply (e.g., Teams if single-user app)
2. **Add domain-specific tests**: Include tests unique to your business logic
3. **Maintain order**: Tests should run sequentially with cleanup at the end
4. **Update regularly**: Keep test cases in sync with feature changes
5. **Cross-reference**: Link test cases to requirements or user stories if available
