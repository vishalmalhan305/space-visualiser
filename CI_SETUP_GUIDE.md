# PR Check CI/CD Setup Instructions

## Overview

This guide explains how the GitHub Actions PR check workflow has been configured and how to enable branch protection rules in your GitHub repository.

## What's Configured

### Files Created/Modified

1. **[backend/visualiser-api/pom.xml](backend/visualiser-api/pom.xml)** (modified)
   - Added `maven-checkstyle-plugin` with Google Java Style Guide
   - Configured to fail on style violations (warnings treated as failures)

2. **[backend/visualiser-api/checkstyle.xml](backend/visualiser-api/checkstyle.xml)** (new)
   - Google Java Style Guide configuration
   - Checks for imports, naming conventions, whitespace, javadoc, and more
   - Line length limit: 100 characters
   - Method length limit: 150 lines

3. **[.github/workflows/pr-checks.yml](.github/workflows/pr-checks.yml)** (new)
   - **Backend Job (`backend-tests-lint`)**
     - Runs on every PR to `main` or `develop`
     - Executes: `mvn clean test` (JUnit tests)
     - Executes: `mvn checkstyle:check` (Checkstyle linting)
     - Executes: `mvn clean install -DskipTests` (full build validation)
     - Uses Java 21 and Maven caching for speed
   
   - **Frontend Job (`frontend-tests-build`)** (conditional)
     - Only runs if `frontend/package.json` exists
     - Executes: `npm ci` (dependency installation)
     - Executes: `npm test` (unit tests)
     - Executes: `npm run build` (production build)
     - Uses Node.js 20 LTS

## Enabling Branch Protection Rules

To block merges on failed checks, configure GitHub repository settings:

### Step-by-Step Instructions

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click **Settings** tab
   - Select **Branches** (left sidebar)

2. **Add/Edit Branch Protection Rule**
   - Click **"Add rule"** or edit existing rule for `main`
   - Repeat for `develop` branch

3. **Configure Rule for `main` Branch**
   - **Branch name pattern**: `main`
   - **Protect matching branches** → Check all of:
     - ✅ **"Require a pull request before merging"**
       - Set required approving reviews to 1 (optional)
       - ☑️ Dismiss stale pull request approvals when new commits are pushed (optional)
       - ☐ Require code reviews from code owners (if using CODEOWNERS, check this)
     
     - ✅ **"Require status checks to pass before merging"**
       - ✅ **"Require branches to be up to date before merging"** (recommended)
       - Search for and select these required status checks:
         - `backend-tests-lint` (required — always present)
         - `frontend-tests-build` (optional — only appears when frontend/package.json exists)
     
     - ✅ **"Restrict who can push to matching branches"** (optional)
       - Allow only admins to push directly (prevents accidental commits to main)
     
     - ✅ **"Include administrators"** unchecked (so admins can force-merge if necessary)
   
   - Click **Save changes**

4. **Repeat for `develop` Branch**
   - Click **"Add rule"** for `develop`
   - Use same settings as `main` (or adjust based on team workflow)
   - Click **Save changes**

### Example Status Checks Display in PRs

Once enabled, PRs will show:
```
✅ backend-tests-lint — All checks passed
✅ frontend-tests-build — Skipped (frontend not yet added)

✅ All required status checks have passed
✅ Merging is blocked until you resolve merge conflicts (if any)
✅ Merging can be performed by maintainers
```

## Testing the Workflow

### Test 1: Code Style Violation (Checkstyle Failure)
1. Create a new branch: `git checkout -b test/checkstyle-failure`
2. In `backend/visualiser-api/src/main/java/com/space/visualiser_api/VisualiserApiApplication.java`:
   - Add a line over 100 characters (violates checkstyle)
   - Example: `String veryLongVariableNameThatWillExceedOneHundredCharactersAndCauseCheckstyleToFailThisCheck = "test";`
3. Commit and push: `git push origin test/checkstyle-failure`
4. Create PR to `develop`
5. **Expected Result**: PR shows `backend-tests-lint` ❌ Failed (Checkstyle violation)
6. Merge is blocked until violation is fixed

### Test 2: Test Failure
1. Create a new branch: `git checkout -b test/failing-test`
2. In `backend/visualiser-api/src/test/java/com/space/visualiser_api/VisualiserApiApplicationTests.java`:
   - Add a failing test assertion
3. Commit, push, create PR
4. **Expected Result**: PR shows `backend-tests-lint` ❌ Failed (JUnit test failed)
5. Merge is blocked

### Test 3: Passing PR
1. Create a new branch: `git checkout -b feature/valid-change`
2. Make a valid code change (respects style guide, all tests pass)
3. Commit, push, create PR
4. **Expected Result**: PR shows `backend-tests-lint` ✅ Passed
5. Merge can be performed (if you have permission)

## Notes & Troubleshooting

### Checkstyle Configuration
- **Severity**: Set to `warning` in pom.xml (violations shown as warnings but fail the build)
- **Exclusions**: To exclude generated code, modify `checkstyle.xml` or use `<!-- eslint-disable -->` comments
- **Custom Rules**: Edit [backend/visualiser-api/checkstyle.xml](backend/visualiser-api/checkstyle.xml) to add/remove checks

### If JUnit Tests Require Database
If tests fail with "database connection" errors:
- Tests may require PostgreSQL/Redis running
- **Option 1**: Use TestContainers in tests (auto-manages containers)
- **Option 2**: Add Docker Compose step to workflow (will slow down CI)
- **Option 3**: Mock database dependencies in tests

Currently, tests run without external services. To add services, modify `.github/workflows/pr-checks.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

### Frontend Addition
When you create the frontend project:
1. Create the `frontend/` directory with `package.json`
2. Push to a branch and open PR
3. GitHub will detect `frontend/package.json` and automatically run `frontend-tests-build` job
4. No workflow changes needed

## References

- [Microsoft GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Checkstyle Documentation](https://checkstyle.org/)
- [Maven Checkstyle Plugin](https://maven.apache.org/plugins/maven-checkstyle-plugin/)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

