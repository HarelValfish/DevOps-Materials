# CI/CD Module Lesson Plan

## Full Course Topics Overview

1. Introduction to the CI/CD World
2. Introduction to GitHub Actions
3. Workflows, Events, and Runners
4. Working with YAML and Building Pipelines
5. Workflows and Events - Deep Dive
6. Integrating Docker into CI/CD
7. Working with Secrets and Environment Variables
8. Automated Deployments
9. Working with Cloud Providers
10. Monitoring, Logs, and Debugging
11. CI/CD Best Practices and Modern Architecture

---

## 1. Introduction to the CI/CD World

Based on Presentation 8.1

### 1.1 Moving from Manual Work to Automation

Explain that in modern environments applications are constantly changing, developers work simultaneously, and new code is pushed to GitHub every few minutes. In this reality it is no longer possible to rely on manual work or local builds on a developer laptop because every developer works with a different environment, different versions, and different dependencies. The goal is to help students understand why organizations need a centralized and consistent process that can pull the latest code, perform builds, run tests, and verify that the system can actually work correctly.

Things the central server should know how to do:

- Pull code automatically
- Run builds
- Execute tests
- Create Docker images
- Store secrets and passwords
- Perform deployments
- Work consistently without human dependency

The main point is that the goal of DevOps is to reduce as many manual operations as possible and move them into stable, fast, and reliable automation.

---

### 1.2 Why Manual Processes No Longer Work

Explain why manual processes are no longer suitable for modern systems. In the past, build and deployment processes were done manually, which consumed a lot of time and created many human errors. A single forgotten command or incorrect version could break the entire production environment.

Examples of a manual process:

- Developer pushes code to GitHub
- Files are copied manually to a server
- Build is executed manually
- Files are uploaded manually to a testing server
- QA checks are performed manually
- Deployment to Production is done manually

Emphasize that this process is:

- Slow
- Unstable
- Not scalable
- Highly dependent on people

---

### 1.3 The Importance of Automated Testing

Explain the importance of automated testing before every deployment. In modern environments it is impossible to rely on someone remembering to test the system manually. Once code is pushed, the system should automatically verify that everything still works correctly before moving to the next stages.

Basic flow:

1. Developer pushes code
2. Build process starts
3. Automated tests run
4. If something fails, the process stops
5. If everything passes, deployment continues

The goal is to prevent broken code from reaching Production.

---

### 1.4 Initial Introduction to CI/CD

Introduce the concepts of CI/CD in a simple way without going too deep technically. Explain that CI, Continuous Integration, is the process where every code change is automatically tested and built, while CD, Continuous Delivery / Deployment, is the stage where the system automatically deploys changes into different environments.

It is important to connect students to real-world scenarios and explain that modern systems usually contain multiple workflows, where each workflow is responsible for a different task inside the automation pipeline.

Examples of common workflows:

- Workflow that runs tests when a Pull Request is opened
- Workflow that performs a build after a push to main
- Workflow that creates and pushes a Docker image to a registry
- Workflow that performs automatic deployment to Production
- Workflow that runs nightly backups or security scans

The main idea is understanding that the entire process works automatically without depending on human interaction.

---

### 1.5 Introduction to Common CI/CD Tools

Present the main CI/CD tools in a high-level way and explain that all of them work around the same idea: detecting code changes, running pipelines, performing builds, running tests, and eventually deploying automatically.

Main tools:

- Jenkins
- GitHub Actions
- GitLab CI/CD

Explain that the course will mainly focus on GitHub Actions because of its simplicity and native integration with GitHub.

---

### 1.6 The Big Picture: How a Modern System Works

Present the big picture of a modern infrastructure and explain how all components connect together into one automated process.

General flow:

1. Developers push code to GitHub
2. CI/CD pipeline is triggered
3. Build process starts
4. Docker image is created
5. Automated tests run
6. Deployment to testing environment
7. After approval, deployment to Production
8. Kubernetes runs the containers
9. Monitoring systems track the environment

The goal is to demonstrate that this entire chain can work automatically from start to finish.

---

### 1.7 DevOps as a Culture

Conclude by explaining that DevOps is not only about tools, but about an entire culture focused on creating faster, more stable, and more automated collaboration between development, infrastructure, and QA teams.

Main concepts:

- Automation
- Collaboration
- CI/CD
- Monitoring
- Fast and continuous delivery
- Reducing human errors

Finish with the message that CI/CD is one of the main foundations that enables modern DevOps practices to work efficiently.

---

## 2. Introduction to GitHub Actions

Based on Presentation 8.2

### 2.1 Understanding the Purpose of GitHub Actions

Explain that GitHub Actions is GitHub's built-in automation platform that allows us to automate development and DevOps processes directly from the repository itself. The goal at this stage is not to go too deep technically, but to help students understand that GitHub can react to events and automatically execute operations.

Examples of common operations:

- Running automated tests
- Building applications
- Creating Docker images
- Deploying applications
- Running scheduled automations
- Triggering workflows after Pull Requests or Push events

Emphasize that modern DevOps environments rely heavily on event-driven automation.

---

### 2.2 High-Level Understanding of the GitHub Actions Architecture

Introduce the basic hierarchy of GitHub Actions in a simple and visual way.

Explain the relationship between:

- Workflow
- Job
- Step
- Runner

The goal is not to memorize syntax yet, but to understand the execution flow.

Basic explanation:

- Workflow = the full automation process
- Job = a group of operations running together
- Step = a single action or command
- Runner = the machine that executes the workflow

Emphasize that GitHub Actions eventually executes regular commands on a machine, and the YAML file simply defines what should happen and when.

---

### 2.3 Understanding Events and Workflow Triggers

Explain that workflows do not run randomly. Every workflow listens to specific events inside GitHub.

Common trigger examples:

- `push`
- `pull_request`
- `workflow_dispatch`
- `schedule`

Explain that once the defined event occurs, GitHub scans the repository, detects the workflow file inside `.github/workflows`, and starts the automation process automatically.

---

### 2.4 Short Introduction to GitHub Actions Pricing

Briefly mention that GitHub Actions is free for public repositories and includes limited free usage for private repositories. Explain that organizations usually pay based on runner minutes and storage usage.

There is no need to go deep into billing at this stage.

---

## 3. First Practical Demonstration: Creating the First Workflow

### 3.1 Creating a Basic Repository from the GitHub UI

Start the first live demonstration directly from GitHub without using an IDE yet. The purpose is to simplify the first interaction and show students that GitHub Actions can initially be managed entirely from the browser.

Repository setup:

- Create a new public repository
- Initialize with README
- Suggested name: `gh-first-action`

Explain that at this stage there is intentionally no local project yet.

---

### 3.2 Creating the First Workflow from the Actions Tab

Move into the Actions tab and explain that this is the central place where GitHub manages automation processes.

Demonstrate:

- Creating a new workflow
- Selecting "Set up a workflow yourself"
- Creating the YAML file directly from the browser

Explain that GitHub only recognizes workflow files located under:

```text
.github/workflows/
```

Emphasize that workflows are simply YAML configuration files stored inside the repository like any other file.

---

### 3.3 Writing the First Basic Workflow

Create the first minimal workflow together with the students.

The workflow should:

- Run manually using `workflow_dispatch`
- Contain one job
- Run on `ubuntu-latest`
- Execute simple `echo` commands

Explain the workflow section by section:

- `name`
- `on`
- `jobs`
- `runs-on`
- `steps`
- `run`

The goal is to remove the fear from YAML files and help students understand that GitHub Actions is mostly configuration that executes shell commands.

---

### 3.4 Executing and Monitoring the Workflow

After committing the workflow, move back to the Actions tab and demonstrate how GitHub automatically detects the workflow.

Demonstrate:

- Running the workflow manually
- Viewing execution status
- Opening the job logs
- Viewing the output of every step

Explain that this is one of the most important concepts in CI/CD environments: visibility and observability of automation processes.

Students should understand that:

- Every step produces logs
- Every command can succeed or fail
- GitHub provides full visibility into the execution process

---

### 3.5 Cloning the Repository Locally

After the workflow successfully runs, perform a clone of the repository to the local machine and open it in VS Code.

The goal here is extremely important:

Students need to understand that GitHub Actions workflows are simply regular YAML files stored inside the repository.

Show the students the actual structure:

```text
.github/
+-- workflows/
    +-- first-action.yml
```

Emphasize:

- GitHub Actions is not "magic"
- GitHub scans the repository for YAML files
- The workflows are version controlled like any other file
- Everything eventually becomes configuration + shell commands

This is one of the most important mindset moments in the entire introduction section.

---

### 3.6 Connecting the Idea to Real DevOps Environments

Conclude the practical section by connecting the demonstration to real-world systems.

Explain that in production environments these workflows become much larger and can include:

- Running automated tests
- Installing dependencies
- Building React or Node.js applications
- Creating Docker images
- Deploying applications to cloud environments
- Running security scans
- Triggering deployments only after tests succeed

The goal is to help students understand that they already built the foundation of a real CI/CD pipeline, even if the current workflow is still very simple.

---

## 4. Moving to a Real React Project

Based on Presentation 8.2, Slide 31

### 4.1 Transition from Simple Demo to Real Project

Explain that until now the students worked with a very small workflow whose purpose was mainly understanding the architecture of GitHub Actions. At this stage the goal is to move into a more realistic example that behaves closer to real DevOps environments.

Introduce a simple React application and explain that from this point the workflows will start interacting with actual project dependencies, tests, and build processes.

Emphasize that this is the point where CI, Continuous Integration, starts becoming meaningful.

---

### 4.2 Introducing the React Project Structure

Present the example React project and explain that the project already contains:

- Basic React application
- Standard `package.json` configuration
- Simple UI components
- Unit tests
- Node.js dependency structure

The goal is not to teach React itself, but to use a realistic application as the target for CI/CD processes.

Explain that in real companies GitHub Actions usually interacts with projects exactly like this.

---

### 4.3 Running the Project Locally

Run the project locally together with the students before introducing automation.

Commands demonstrated:

```bash
npm install
npm run dev
```

Explain that before automating systems in CI/CD environments, developers first verify that the application works correctly locally.

Demonstrate:

- Installing dependencies
- Starting the local development server
- Accessing the application in the browser

This stage helps students connect the workflow to an actual working application instead of abstract YAML files.

---

### 4.4 Running the Tests Locally

Run the tests locally before introducing GitHub Actions automation.

Command demonstrated:

```bash
npm test
```

Explain that this is extremely important because GitHub Actions will later execute the exact same commands automatically.

The students should understand:

- CI/CD pipelines are mostly automation of commands developers already run manually
- GitHub Actions is not inventing new logic
- The workflow simply executes the same commands on a remote runner

This is one of the most important concepts in the entire section.

---

### 4.5 Creating the Workflow Structure Locally

Move into the project folder and create the GitHub Actions structure manually.

Required structure:

```text
.github/workflows/
```

Create the first real workflow file:

- `test.yml`

Explain that GitHub only scans workflow files from this exact location.

Emphasize again that GitHub Actions workflows are simply YAML configuration files stored inside the repository.

---

### 4.6 Creating the First Real CI Workflow

Create the first real testing workflow together with the students.

The workflow should:

- Trigger on `push`
- Use `ubuntu-latest`
- Checkout the repository
- Install Node.js
- Install dependencies
- Run tests

Important concepts introduced during this section:

- `actions/checkout`
- `uses` vs `run`
- `npm ci`
- `npm test`

Explain that this is already a real Continuous Integration process.

Every push now automatically verifies that the project still builds and passes tests.

---

### 4.7 Explaining actions/checkout

Pause and explain one of the most important concepts students usually misunderstand.

Explain that until now the workflows only executed `echo` commands, but real workflows require access to the repository code itself.

This is the role of:

- `actions/checkout`

Explain:

- `uses` = using a reusable GitHub Action
- `actions/checkout` = official GitHub action for cloning the repository into the runner
- Without checkout the runner does not have the project files

This is a critical mindset moment because students begin understanding that workflows execute on temporary remote machines.

---

### 4.8 Installing Dependencies in the Workflow

After explaining `actions/checkout`, continue to the next important step: installing the project dependencies inside the GitHub Actions runner.

Explain that the runner is a clean temporary machine. Even though the repository files are now available after checkout, the `node_modules` folder does not exist yet.

This is why the workflow must install dependencies before running tests.

Recommended command for CI:

```bash
npm ci
```

Explain:

- `npm ci` installs dependencies based on `package-lock.json`
- `npm ci` is usually preferred in CI/CD because it is clean and predictable
- Without installing dependencies, commands like `npm test` may fail
- The pipeline should reproduce the same setup every time it runs

Emphasize that this step connects the local development process to automation:

- Locally, developers run `npm install`
- In CI, the workflow usually runs `npm ci`
- After dependencies are installed, the workflow can safely run tests or builds

---

### 4.9 Running Tests in the Workflow

After the dependencies are installed, add the test command to the workflow.

Command used in the workflow:

```bash
npm test
```

Explain that this is the main CI validation step. The workflow is no longer only preparing the project; it is now checking whether the code actually works.

Students should understand:

- Tests run automatically after every push
- If the tests pass, the workflow can continue
- If the tests fail, the workflow stops and marks the pipeline as failed
- This prevents broken code from silently moving forward

Emphasize that this is the core idea of Continuous Integration: every new code change is automatically verified before it is trusted.

---

### 4.10 Executing the Workflow and Viewing the Pipeline

Commit and push the workflow file to GitHub.

Demonstrate how the workflow automatically starts after push.

Inside the Actions tab demonstrate:

- Repository checkout
- Dependency installation
- Test execution
- Successful workflow completion

Explain that students are now watching a real CI pipeline execute automatically.

---

### 4.11 Introducing Workflow Failures

Intentionally break one of the tests inside the React project.

The goal is to demonstrate one of the most important ideas in CI/CD:

A pipeline should fail when the code is broken.

Demonstrate:

- Breaking a test
- Running tests locally
- Committing the broken code
- Push triggering the workflow
- Failed workflow inside GitHub Actions

Open the logs and explain how developers debug pipeline failures in real environments.

Then fix the broken test or perform a git revert.

Demonstrate:

- Committing the fix
- Push triggering a new workflow
- Successful test pipeline execution

Emphasize that the pipeline must be green again before adding deployment logic.

---

### 4.12 Adding a Second Job: Deploy

After the test workflow is working, continue by expanding the workflow into a simple CI/CD pipeline with a second job.

Explain that until now the workflow only tested the application. The next step is to add another job that simulates deployment.

Update the workflow:

- Change the workflow name to `Deploy`
- Rename the workflow file from `test.yml` to `deploy.yml`
- Keep the existing test job
- Add a second job for deployment

The new deploy job should:

- Checkout the repository
- Install dependencies using `npm i`
- Build the project using `npm run build`
- Run an `echo` command that simulates deployment

Example deploy steps:

```yaml
deploy:
  runs-on: ubuntu-latest

  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Install dependencies
      run: npm i

    - name: Build project
      run: npm run build

    - name: Simulate deployment
      run: echo "Deployment"
```

Explain that this is not a real production deployment yet. It is only a simulation that helps students understand the pipeline structure before connecting real servers, Docker, Kubernetes, or cloud providers.

---

### 4.13 Using `needs` Between Jobs

After adding the deploy job, explain an important problem:

By default, jobs can run independently. In a real pipeline, deployment must not happen if tests fail.

Introduce the `needs` keyword.

Example:

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
```

Explain:

- `needs: test` means the deploy job depends on the test job
- GitHub Actions will run the deploy job only after the test job succeeds
- If the test job fails, the deploy job will be skipped
- This protects the deployment stage from broken code

Emphasize that this is one of the most important CI/CD rules:

Do not deploy if the validation stage failed.

---

### 4.14 Using Multiple Workflow Triggers

After explaining job dependencies, introduce the idea that a workflow can have more than one trigger.

Until now the workflow ran mainly after a `push`. Add a manual trigger as well so the workflow can be started from the GitHub UI.

Example:

```yaml
on:
  push:
  workflow_dispatch:
```

Explain:

- `push` runs the workflow automatically when code is pushed
- `workflow_dispatch` allows running the workflow manually from the Actions tab
- A workflow can support both automatic and manual execution

This helps students understand that GitHub Actions workflows can react to different events depending on the use case.

---

### 4.15 Introduction to Expressions and GitHub Context

Introduce expressions in GitHub Actions at a very basic level.

Explain that expressions allow the workflow to read dynamic information from GitHub and use it inside jobs and steps.

Basic expression syntax:

```yaml
${{ expression }}
```

Example using the GitHub context:

```yaml
- name: Print branch name
  run: echo "Branch: ${{ github.ref_name }}"
```

Another example:

```yaml
- name: Print commit SHA
  run: echo "Commit: ${{ github.sha }}"
```

Explain:

- `github` is a context object provided by GitHub Actions
- `github.ref_name` contains the branch or tag name
- `github.sha` contains the commit SHA that triggered the workflow
- Expressions make workflows more dynamic and reusable

At this stage, keep the explanation simple. The goal is only to introduce the idea that workflows can use information from the event that triggered them.

---

## 5. Workflows and Events - Deep Dive

Based on Presentation 8.3

### 5.1 Understanding Events in GitHub Actions

Start by returning to the question of what actually causes a workflow to run.

Explain that an event is an action that happens inside GitHub. GitHub Actions listens to these events, and when the workflow file is configured for a matching event, GitHub starts the workflow automatically.

Examples of GitHub events:

- Code is pushed to a branch
- Pull Request is opened or updated
- Pull Request is closed
- Workflow is started manually from the GitHub UI
- Workflow is started on a schedule
- Issue is opened, edited, or closed
- Tag or branch is created

Emphasize that GitHub Actions is event-driven automation.

The workflow does not run because someone opened VS Code or because the file exists locally. It runs because something happened in GitHub and the workflow was configured to react to that event.

---

### 5.2 Main Types of Workflow Events

Introduce the main event families in a high-level way before writing YAML.

Repository-related events:

- `push`
- `pull_request`
- `issues`
- Creating branches or tags
- Fork-related activity

Manual events:

- `workflow_dispatch`

Scheduled events:

- `schedule`

Explain that each event is useful for a different automation scenario.

Examples:

- Use `push` when every code update should trigger validation
- Use `pull_request` when code should be tested before merging
- Use `workflow_dispatch` when a human should be able to start the pipeline manually
- Use `schedule` when automation should run at fixed times, such as nightly checks

At this stage, keep the message simple:

The event answers the question: "When should this workflow start?"

---

### 5.3 Moving from the React Example to a Backend Project

Explain that until now the students worked with a frontend-style React project and basic CI workflows. In this chapter, the goal is to move into a backend project and use it to understand workflow triggers more deeply.

Introduce the Express project from the presentation.

The project includes:

- Basic Express server
- API for managing users
- Health routes
- Environment configuration
- Middleware
- Unit and integration tests
- Standard `package.json` scripts

Emphasize that the focus is not learning Express. The backend project is simply a realistic target for GitHub Actions.

The important point is that CI/CD workflows work with any project type:

- React
- Node.js backend
- Python
- Java
- Docker-based applications
- Infrastructure repositories

The commands may change, but the GitHub Actions structure stays similar.

---

### 5.4 Preparing the Backend Project

Demonstrate the project preparation flow.

Suggested classroom flow:

1. Download or copy the example Express project
2. Extract the files into a new folder
3. Initialize a local Git repository if needed
4. Create a GitHub repository
5. Push the project to GitHub

Explain that GitHub Actions only runs from a GitHub repository. Local files alone are not enough.

Before writing workflows, quickly show the project structure:

```text
src/
+-- app.ts
+-- server.ts
+-- config/
+-- middleware/
+-- modules/
+-- routes/
tests/
+-- users.test.ts
package.json
package-lock.json
```

The goal is to help students understand what the workflow will later validate.

---

### 5.5 Running the Backend Project Locally

Run the backend project locally before automating it.

Commands demonstrated:

```bash
npm install
npm run dev
```

Explain that local execution gives confidence that the application itself works before debugging GitHub Actions.

Demonstrate:

- Installing dependencies
- Starting the development server
- Opening or testing the local API
- Stopping the server before continuing

Emphasize again that CI/CD is usually automation of commands that developers already understand locally.

---

### 5.6 Running Backend Tests Locally

Run the test command locally.

Command demonstrated:

```bash
npm test
```

Explain that this project already contains tests, and the test command will later become the core validation step inside the workflow.

Students should understand:

- The test command must pass locally before it is trusted in CI
- GitHub Actions will execute the same command on a clean runner
- If the command fails locally, it will usually fail in GitHub Actions too
- Debugging locally is often faster than debugging only through remote logs

This prepares the class for the next step: moving the same test process into automation.

---

### 5.7 Creating the GitHub Actions Folder Structure

Create the required workflow folder structure inside the backend project.

Required structure:

```text
.github/
+-- workflows/
```

Create a workflow file:

```text
.github/workflows/test.yaml
```

Explain:

- `.github` is the special GitHub configuration folder
- `workflows` is where GitHub looks for workflow files
- Workflow files are YAML files
- GitHub detects them only after they are committed and pushed

This is another important reminder that GitHub Actions is repository configuration, not a separate external tool.

---

### 5.8 Starting with the `push` Event

Introduce `push` as one of the most common GitHub Actions events.

Basic example:

```yaml
on: push
```

Explain that this means the workflow will run when code is pushed to the repository.

Then explain the problem:

`on: push` is powerful, but it is also very general. By default, it can react to pushes on different branches, and that may create unnecessary workflow runs.

Examples of when this can become a problem:

- Running tests for every temporary branch
- Triggering deployment logic from development branches
- Wasting runner minutes on irrelevant changes
- Running production-related workflows too early

The main teaching point:

A trigger should be as broad as needed, but as specific as the real workflow requires.

---

### 5.9 Adding Multiple Events to One Workflow

Explain that one workflow can listen to more than one event.

For example, a workflow can run automatically after a push and also allow manual execution from the Actions tab.

Example:

```yaml
on:
  push:
  workflow_dispatch:
```

Explain:

- `push` runs the workflow automatically after code is pushed
- `workflow_dispatch` adds a manual Run workflow button in GitHub
- Multiple events make the workflow more flexible

Emphasize a small syntax point:

When using expanded YAML syntax, even an event with no extra configuration should include the colon:

```yaml
workflow_dispatch:
```

This prevents confusion when students move from the short syntax to the full syntax.

---

### 5.10 Filtering `push` by Branch

Explain that workflows often should run only for specific branches.

Example:

```yaml
on:
  push:
    branches:
      - main
```

Explain that this workflow runs only when code is pushed to `main`.

This is useful when:

- `main` represents stable code
- Deployment should happen only from `main`
- Development branches should not trigger production workflows
- The team wants to reduce unnecessary CI runs

Connect this to real DevOps behavior:

In many companies, different branches represent different environments.

Examples:

- `dev`
- `test`
- `staging`
- `main`
- `release/*`

The workflow trigger should match the purpose of the environment.

---

### 5.11 Ignoring Branches and Using Branch Patterns

Introduce the opposite approach: instead of saying which branches should trigger the workflow, we can say which branches should not trigger it.

Example:

```yaml
on:
  push:
    branches-ignore:
      - dev
      - "temp-*"
```

Explain:

- Pushes to `dev` will not trigger the workflow
- Pushes to branches that start with `temp-` will not trigger the workflow
- Other branches can still trigger it

Introduce wildcard patterns carefully.

Examples:

- `release/*` can match release branches
- `feature/**` can match nested feature branch patterns
- `temp-*` can match temporary branch names

Do not go too deep into every pattern rule yet. The goal is to show students that GitHub Actions can control workflow execution based on branch naming.

---

### 5.12 Filtering by File Paths

Explain that workflows can also run only when specific files or folders change.

Example:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - "src/**"
```

Explain:

- The workflow runs only on pushes to `main`
- It runs only if files under `src/` changed
- Changes to unrelated files may not trigger the workflow

This is useful in repositories where not every change needs the same pipeline.

Examples:

- Source code changes should run tests
- Documentation-only changes may not need a full build
- Infrastructure changes may need a different workflow
- Frontend and backend folders may have separate pipelines

Then introduce path exclusions.

Example:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - "src/**"
      - "!docs/**"
```

Explain that `!docs/**` excludes documentation paths from this trigger pattern.

Emphasize that path filters help reduce unnecessary runs and keep CI/CD focused on relevant changes.

---

### 5.13 Combining Branch and Path Filters

Show a fuller example that combines multiple filters.

Example:

```yaml
on:
  push:
    branches:
      - main
      - "release/**"
    paths-ignore:
      - ".github/workflows/**"
```

Explain the meaning:

- The workflow runs only for pushes to `main` or branches under `release/**`
- It does not run when only workflow files changed
- The trigger becomes much more intentional

Explain that filters are not only a performance optimization. They are also part of pipeline design.

Good trigger design helps protect:

- Production environments
- Paid runner minutes
- Developer focus
- CI/CD reliability

---

### 5.14 Understanding `pull_request` Events

Introduce Pull Request automation.

Basic example:

```yaml
on:
  pull_request:
    branches:
      - main
```

Explain that this workflow runs when a Pull Request targets the `main` branch.

This is one of the most important CI use cases:

Before code enters the main branch, GitHub Actions can automatically test it.

Explain the difference between `push` and `pull_request`:

- `push` reacts when code is pushed to a branch
- `pull_request` reacts to PR activity before or during the merge process

In real teams, Pull Request workflows are often used as a quality gate before merge.

---

### 5.15 Activity Types in Pull Requests

Explain that some events have smaller sub-events called activity types.

For `pull_request`, common activity types include:

- `opened`
- `closed`
- `reopened`
- `synchronize`
- `edited`

Explain each one briefly:

- `opened` means the Pull Request was created
- `closed` means the Pull Request was closed or merged
- `reopened` means a closed Pull Request was opened again
- `synchronize` usually means new commits were pushed to the Pull Request
- `edited` means Pull Request metadata was changed

Example:

```yaml
on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - closed
```

Explain:

- The workflow runs when a Pull Request to `main` is opened
- The workflow also runs when that Pull Request is closed
- It will not run for every small PR update unless that activity type is included

This gives much more control than a broad Pull Request trigger.

---

### 5.16 Default Behavior of `pull_request`

Explain an important detail from the presentation:

If we configure only this:

```yaml
on:
  pull_request:
```

GitHub does not run the workflow for every possible Pull Request action.

By default, common Pull Request runs happen for actions such as:

- `opened`
- `reopened`
- `synchronize`

Explain that `closed` is not included by default.

Therefore, if the workflow must run when a Pull Request is closed or merged, the workflow should explicitly include `closed`.

Example:

```yaml
on:
  pull_request:
    types:
      - opened
      - synchronize
      - closed
```

The main point:

Do not assume every PR action triggers the workflow. Use `types` when the exact behavior matters.

---

### 5.17 Building the Backend Test Workflow

Now connect the event discussion to the real backend workflow.

Example workflow:

```yaml
name: Test Project

on:
  push:
    branches:
      - main
    paths:
      - "src/**"
      - "!docs/**"

  pull_request:
    branches:
      - main
    types:
      - opened
      - closed

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

Explain the workflow section by section:

- `name` gives the workflow a readable name in the Actions tab
- `push` controls automatic runs after pushes
- `branches` limits the push trigger to `main`
- `paths` limits the workflow to relevant file changes
- `pull_request` runs automation for Pull Requests targeting `main`
- `types` controls which PR actions start the workflow
- `jobs.test` defines the test job
- `actions/checkout` downloads the repository into the runner
- `npm ci` installs dependencies cleanly
- `npm test` runs the test suite

Emphasize that the workflow is now much more intentional than a simple `on: push`.

It reacts only to events that matter for the project.

---

### 5.18 Demonstrating the Workflow in GitHub

Commit and push the workflow file.

Demonstrate:

- Push to `main` with a change under `src/`
- Confirm that the workflow starts
- Open the Actions tab
- Open the workflow run
- Inspect the job logs
- Confirm that dependencies install and tests run

Then demonstrate a change that should not trigger the workflow.

Example:

- Change a documentation file
- Push the change
- Show that the workflow does not run if the filters exclude that path

The goal is to make students see that filters are real behavior, not only YAML theory.

---

### 5.19 Demonstrating Pull Request Activity Types

Create a short Pull Request demonstration.

Suggested flow:

1. Create a new branch
2. Make a small change
3. Push the branch
4. Open a Pull Request into `main`
5. Show that the workflow runs because the PR was opened
6. Close the Pull Request
7. Show that the workflow runs again if `closed` is included in `types`

Explain that this is why activity types matter.

Without `types: [opened, closed]`, the workflow behavior may not match what the team expects.

This is especially important when workflows are connected to:

- Deployment cleanup
- Release notes
- Notifications
- Environment cleanup
- Post-merge automation

---

### 5.20 Pull Requests from Forks

Introduce a real-world scenario:

A public repository allows outside contributors. A contributor forks the repository, changes code, and opens a Pull Request back into the original repository.

Explain the flow:

1. A user forks the repository
2. The user changes code in the fork
3. The user opens a Pull Request to the original repository
4. The workflow appears like it should run because it is a Pull Request to `main`

Then explain the important security behavior:

For first-time contributors, GitHub may not run the workflow automatically. Instead, the repository owner may see a message that approval is required before the workflow can run.

Explain why:

- Anyone can fork a public repository
- A fork can contain untrusted code
- A malicious user could try to run harmful workflow commands
- A user could also waste runner minutes by triggering many workflows

GitHub protects the repository by requiring manual approval for first-time contributors.

Emphasize:

If a workflow does not run automatically for a new external contributor, it does not necessarily mean the YAML is broken.

The owner may need to approve the run from the Actions or Pull Request interface.

---

### 5.21 Collaborators vs First-Time Contributors

Explain the difference between trusted and untrusted contributors.

First-time contributor from a fork:

- Workflow may be skipped at first
- Repository owner may need to approve the run
- After approval, future behavior may become smoother for that contributor

Repository collaborator:

- User is already trusted by the repository
- Workflow usually does not require the same first-time approval
- GitHub assumes the collaborator has permission to contribute

Explain that this topic connects directly to CI/CD security.

Automation is powerful, but automation that runs untrusted code must be treated carefully.

---

### 5.22 Canceling Workflow Runs

Introduce workflow cancellation.

Explain that sometimes a workflow is already running, but we know it is no longer useful.

Examples:

- A mistake is noticed immediately after push
- A newer commit already replaces the old one
- The run is taking too long
- The workflow is consuming resources unnecessarily
- The wrong branch triggered the workflow

Demonstrate manual cancellation:

1. Open the repository in GitHub
2. Go to the Actions tab
3. Open the active workflow run
4. Click Cancel workflow

Explain that cancellation is used after a workflow has already started.

Also explain basic failure behavior:

- If a step fails, the job usually fails
- If the job fails, the workflow run becomes failed
- Unless configured differently, later dependent work will not continue

This connects back to the idea that CI/CD pipelines should stop when validation fails.

---

### 5.23 Skipping Workflow Runs

Introduce workflow skipping.

Explain that sometimes a developer knows before pushing that the change does not require CI/CD.

Examples:

- Documentation-only update
- Comment-only change
- README update
- Small text change that does not affect build or tests

Explain that GitHub supports skip keywords in commit messages or Pull Request titles.

Common examples:

```text
[skip ci]
[ci skip]
[skip actions]
[actions skip]
```

Example commit message:

```text
docs: update README [skip ci]
```

Explain:

- The push still happens
- The commit still reaches GitHub
- The workflow is skipped before it starts

Emphasize that skipping should be used carefully. It is useful for clearly safe changes, but it should not become a habit for avoiding tests.

---

### 5.24 Cancel vs Skip

Conclude the chapter by comparing canceling and skipping.

Cancel:

- Used after the workflow already started
- Useful when a mistake is discovered during or after a push
- Saves time and resources from an unnecessary active run
- Done from the GitHub UI

Skip:

- Used before the workflow starts
- Controlled through commit message or Pull Request title
- Useful when the change clearly does not require automation
- Prevents the run from starting in the first place

Simple classroom summary:

- Use cancel when the workflow is already running and should stop
- Use skip when you know in advance that the workflow should not run

Finish with the bigger idea:

Good CI/CD design is not only about writing jobs and steps. It is also about controlling when automation should run, when it should wait, and when it should not run at all.
