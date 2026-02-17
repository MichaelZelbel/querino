---
description: A rigorous development workflow for long-running tasks, enforcing environment checks, incremental progress, and regression testing.
---

# Extended Development Cycle

This workflow implements an "Effective Harness" for long-running coding tasks. It is designed to prevent "context drift" and ensure every session starts on a solid foundation and ends in a clean, committable state.

## 1. Initialize & Orient
**Goal**: Establish context without assumptions.
1.  **Verify Location**: Run `pwd` to confirm the working directory.
2.  **Load State**:
    *   Read `task.md` to identify the *single next highest priority item*.
    *   Read `implementation_plan.md` (if active) to check for existing plans.
    *   View the last 10 git commits: `git log --oneline -n 10` to understand recent history.

## 2. Mandatory Health Check
**Goal**: Never build on broken ground.
1.  **Build Check**: Run the build command (e.g., `npm run build`, `go build`) to ensure syntax and dependencies are clean.
2.  **Regression Check**: Run the *existing* test suite (e.g., `npm test`).
    *   **IF FAILS**: Stop the new feature work. The current task is now **"Fix Broken Environment"**. diagnose and fix the regression first.
    *   **IF PASSES**: Proceed to step 3.

## 3. Incremental Execution
**Goal**: Do one thing well.
1.  **Select Task**: Pick *one* specific item from `task.md`.
2.  **Plan**: If complex, update `implementation_plan.md` with the approach for just this item.
3.  **Implement**: Write the code for this feature.
4.  **Test Coverage**: **You must write a test for this new feature.** Do not mark it done without a way to verify it automatically in the future.

## 4. Verification & Regression
**Goal**: Prove it works and requires no future cleanup.
1.  **Verify New Feature**: Run the new test you just wrote. It must pass.
2.  **Verify System**: Run the FULL test suite again.
    *   Ensure no side effects (regressions) were introduced.
3.  **Visual Verification (If Web App)**:
    *   Use the `browser` tool to verify the feature end-to-end if it involves UI.

## 5. Clean Up & Persist
**Goal**: Leave a clean state for the next agent/session.
1.  **Document**: Update `task.md` (mark item as `[x]`).
2.  **Commit**: Git commit with a standardized message: `feat: [Task Name]`.
3.  **Status**: Briefly summarize the result of this cycle in `task_boundary` or `notify_user`.

---
*Tip: If you find yourself "fighting" the harness (e.g., skipping tests because they take too long), stop and optimize the harness (e.g., fix the slow tests) rather than ignoring the workflow.*
