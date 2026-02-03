# Test Cases Generation Prompt for Lovable AI

Use this prompt in any Lovable project to automatically generate a comprehensive `TEST_CASES.md` document.

---

## The Prompt

Copy and paste this into your Lovable chat:

```
Analyze this project and create a comprehensive TEST_CASES.md document for end-to-end browser-based testing.

## Your Task

1. **Analyze the codebase** to identify:
   - All entity/artifact types (from database schema, types files, and pages)
   - Authentication mechanism and user roles
   - CRUD operations for each entity
   - Premium/gated features
   - Admin functionality
   - Team/workspace features (if any)
   - AI/LLM features (if any)
   - Third-party integrations (Stripe, etc.)

2. **Generate test cases** covering:
   - Authentication & onboarding flows
   - Full CRUD lifecycle for each entity type
   - Library/discovery with search, filters, and sorting
   - Reviews/ratings/comments (if applicable)
   - Premium feature gating and upgrade flows
   - Admin dashboard and user management
   - Profile and settings management
   - Team collaboration (if applicable)
   - AI feature usage and credit tracking (if applicable)
   - Cleanup steps to delete all test data

3. **Use this test case format**:
   ```
   ### TC-[SECTION]-00X: [Action Description]
   1. Navigate to [URL]
   2. [Step-by-step browser instructions]
   3. Validate that [expected outcome]
   ```

4. **Define three test personas** based on the roles in this project (typically Free, Premium, Admin users with test email addresses)

5. **Include an "Expected Test Data" table** summarizing all artifacts created during testing

6. **Save the document** to `docs/TEST_CASES.md`

Make the test cases specific to this project's actual features, URLs, field names, and UI elements. Do not use generic placeholders.
```

---

## What Lovable AI Will Do

When you give this prompt, Lovable will:

1. Read the database schema (`types.ts`) to identify all entities
2. Scan the pages directory to understand available routes
3. Analyze hooks and components to understand feature behavior
4. Check for authentication, premium gating, and admin features
5. Generate specific, actionable test cases for every major feature
6. Save the complete document to `docs/TEST_CASES.md`

---

## Tips

- Run this prompt after your core features are built
- Review the generated test cases and ask for additions if needed
- Re-run periodically as you add new features
- Use "Update docs/TEST_CASES.md with test cases for [new feature]" for incremental updates
