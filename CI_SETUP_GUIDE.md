# CI/CD Setup for Solo Development

This guide explains the automated CI/CD workflow configured for this solo project. The setup runs code quality checks and tests on every push and pull request—no manual intervention needed.

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
     - Runs on every push to `main` or `develop` (and on PRs)
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

## Viewing CI Results

After each push to `main` or `develop`, check the workflow status:

1. **In GitHub**
   - Go to your repository → **Actions** tab
   - See all workflow runs with their status (✅ pass, ❌ fail)
   - Click a run to see detailed logs and which step failed

2. **In Commit History**
   - A checkmark (✓) or ✗ appears next to each commit
   - Green = all checks passed
   - Red = one or more checks failed

3. **No Blocking** (Solo Project)
   - Failed checks don't prevent you from pushing again
   - You can push fixes anytime and re-run the workflow

## Testing the Workflow

### Test 1: Code Style Violation (Checkstyle Failure)
1. Create a new branch: `git checkout -b test/checkstyle-failure`
2. In `backend/visualiser-api/src/main/java/com/space/visualiser_api/VisualiserApiApplication.java`:
   - Add a line over 100 characters (violates checkstyle)
   - Example: `String veryLongVariableNameThatWillExceedOneHundredCharactersAndCauseCheckstyleToFailThisCheck = "test";`
3. Commit and push: `git push origin test/checkstyle-failure`
4. **Expected Result**: Go to GitHub Actions tab and see `backend-tests-lint` ❌ Failed (Checkstyle violation)
5. Fix the violation and push again—workflow re-runs automatically

### Test 2: Test Failure
1. Create a new branch: `git checkout -b test/failing-test`
2. In `backend/visualiser-api/src/test/java/com/space/visualiser_api/VisualiserApiApplicationTests.java`:
   - Add a failing test assertion
3. Commit and push
4. **Expected Result**: GitHub Actions shows `backend-tests-lint` ❌ Failed (JUnit test failed)
5. Fix and push again to see it pass

### Test 3: Passing Commit
1. Create a new branch: `git checkout -b feature/valid-change`
2. Make a valid code change (respects style guide, all tests pass)
3. Commit and push
4. **Expected Result**: GitHub Actions shows `backend-tests-lint` ✅ Passed
5. Merge to main/develop whenever ready

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

