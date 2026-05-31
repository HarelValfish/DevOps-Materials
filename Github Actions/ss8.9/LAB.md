# Lab 9 — Production Backend Deployment

## GitHub Actions → ECR → ALB + ASG (No SSH, No Keys)

### Goal

By the end of this lab, every push to `main` triggers a fully automated deployment across all running instances. The final output of the pipeline is a real DNS name:

```
Git Push
    ↓
GitHub Actions
    ↓
OIDC Login to AWS              ← no access keys stored anywhere
    ↓
Build Docker Image
    ↓
Push Image to ECR
    ↓
SSM Send Command               ← targets all ASG instances by tag
    ↓                             no SSH, port 22 stays closed
Every EC2 in ASG:
  Pull new image
  Stop old container
  Start new container
    ↓
Health Check via ALB
    ↓
✅ http://<alb-dns-name>.elb.amazonaws.com
```

**No AWS access keys in GitHub. No SSH. Port 22 closed. Instances managed by ASG. Deployment runs on all instances simultaneously.**

---

## The Application

The `express-api/` folder contains a ready-to-use Node.js API:

```
express-api/
├── app.js
├── package.json
├── Dockerfile
└── routes/
    └── index.js
```

| Endpoint       | Response                                               |
|----------------|--------------------------------------------------------|
| `GET /`        | `{ "message": "Hello from student-api!" }`            |
| `GET /health`  | `{ "status": "ok" }`                                  |
| `GET /version` | `{ "version": "1.0", "commit": "local" }`            |

**Copy this folder into your own GitHub repository before starting.**

---

## Required Repository Secrets

Add these under **Settings → Secrets and variables → Actions**:

| Secret          | Value                                                                                         |
|-----------------|-----------------------------------------------------------------------------------------------|
| `AWS_ROLE_ARN`  | ARN of the IAM role you create in Part B                                                     |
| `ASG_NAME`      | Name of the Auto Scaling Group you create in Task 7                                          |
| `ALB_DNS_NAME`  | ALB DNS name from Task 6 (e.g. `student-api-alb-123456789.us-east-1.elb.amazonaws.com`)     |

---

## Final Architecture

```
Internet
    │  HTTP :80
    ▼
Application Load Balancer          (alb-sg: allows :80 from internet)
    │  HTTP :3000
    ▼
Auto Scaling Group
    ├── EC2 Instance A             (ec2-sg: allows :3000 from alb-sg only)
    │       └── Docker Container   (student-api on port 3000)
    └── EC2 Instance B             (spins up automatically if A fails)
            └── Docker Container   (student-api on port 3000)
```

- **Why ASG?** A single EC2 is a single point of failure. The ASG replaces unhealthy instances automatically. It also allows horizontal scaling.
- **Why ALB?** It distributes traffic across all healthy instances and provides the DNS name.
- **Why SSM targeting by tag?** The pipeline targets all ASG instances by group tag — no hardcoded instance IDs. When the ASG launches a new instance it is automatically included in the next deployment.

---

## Part A — AWS Infrastructure

### Task 1 — Create ECR Repository

1. Open the **ECR** console
2. Click **Create repository**
3. Select **Private**
4. Name: `student-api`
5. Leave all other settings at default → Create

**Deliverable:** Screenshot of the created ECR repository.

---

### Task 2 — Create Security Groups

Create **two security groups** before anything else.

#### Security Group 1 — `alb-sg`

| Direction | Protocol | Port | Source       |
|-----------|----------|------|-------------- |
| Inbound   | TCP      | 80   | `0.0.0.0/0`  |
| Outbound  | All      | All  | `0.0.0.0/0`  |

#### Security Group 2 — `ec2-sg`

| Direction | Protocol | Port | Source                      |
|-----------|----------|------|-----------------------------|
| Inbound   | TCP      | 3000 | `alb-sg` (select from list) |
| Outbound  | All      | All  | `0.0.0.0/0`                 |

> **Why only port 3000 inbound, and nothing else?**
> - Port 22: not needed — no key pair, no SSH ever.
> - Port 443 inbound: not needed — the SSM Agent makes *outbound* HTTPS connections to AWS. The outbound `All` rule covers this.
> - Port 3000: scoped to `alb-sg` only, so the EC2 accepts application traffic exclusively from the ALB.

**Deliverable:** Both security groups created.

---

### Task 3 — Create EC2 IAM Role

Every EC2 instance in the ASG needs an IAM role so it can:
- Register with Systems Manager (SSM Agent)
- Pull Docker images from ECR

1. Go to **IAM → Roles → Create role**
2. Trusted entity: **AWS service → EC2**
3. Attach these two managed policies:

| Policy                               | Why                                                              |
|--------------------------------------|------------------------------------------------------------------|
| `AmazonSSMManagedInstanceCore`       | Allows SSM Agent to register and receive commands                |
| `AmazonEC2ContainerRegistryReadOnly` | Allows the EC2 to run `aws ecr get-login-password` and pull images |

4. Name: `ec2-ssm-ecr-role`
5. Create the role

**Deliverable:** IAM role `ec2-ssm-ecr-role` exists.

---

### Task 4 — Create a Launch Template

A Launch Template defines the configuration for every EC2 the ASG launches. Using User Data, Docker and AWS CLI are installed automatically on every new instance — no manual step needed.

1. Go to **EC2 → Launch Templates → Create launch template**
2. Name: `student-api-lt`
3. AMI: search for **Ubuntu Server 22.04 LTS** (64-bit x86)
4. Instance type: `t3.micro`
5. Key pair: **Don't include in launch template** (no SSH)
6. Security groups: `ec2-sg`
7. IAM instance profile: `ec2-ssm-ecr-role`
8. Expand **Advanced details** → paste the following into **User data**:

```bash
#!/bin/bash
set -e
apt-get update -y
apt-get install -y docker.io unzip curl
systemctl start docker
systemctl enable docker
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip
```

> This script runs automatically every time the ASG launches a new instance. Docker and AWS CLI will be ready before the first pipeline deployment runs.

9. Create launch template

**Deliverable:** Launch Template `student-api-lt` created.

---

### Task 5 — Create a Target Group

1. Go to **EC2 → Target Groups → Create target group**
2. Target type: **Instances**
3. Name: `student-api-tg`
4. Protocol: **HTTP**
5. Port: **3000**
6. Health check path: `/health`
7. Click **Next** — do **not** add any targets manually. The ASG will register instances automatically.
8. Create target group

> You will see the target group is empty for now. That is expected — the ASG fills it in Task 7.

**Deliverable:** Target group `student-api-tg` created (no targets yet).

---

### Task 6 — Create the Application Load Balancer

1. Go to **EC2 → Load Balancers → Create load balancer**
2. Choose **Application Load Balancer**
3. Name: `student-api-alb`
4. Scheme: **Internet-facing**
5. IP address type: **IPv4**
6. Network mapping: select **at least 2 Availability Zones** with public subnets
7. Security group: **`alb-sg`** (remove the default)
8. Listener: **HTTP :80 → Forward to `student-api-tg`**
9. Create load balancer

After creation, copy the **DNS name** from the ALB details page.

> Example: `student-api-alb-123456789.us-east-1.elb.amazonaws.com`

Add this as the `ALB_DNS_NAME` secret in your GitHub repository.

**Deliverable:** ALB in "Active" state. DNS name saved as a secret.

---

### Task 7 — Create the Auto Scaling Group

1. Go to **EC2 → Auto Scaling Groups → Create Auto Scaling group**
2. Name: `student-api-asg`
3. Launch template: `student-api-lt`
4. Network: select **the same Availability Zones** you chose for the ALB (important — subnets must match)
5. Load balancing: **Attach to an existing load balancer** → choose `student-api-tg`
6. Health checks: set type to **ELB** (the ASG will replace instances that the ALB marks unhealthy)
7. Group size:

| Setting          | Value |
|------------------|-------|
| Minimum capacity | 1     |
| Desired capacity | 1     |
| Maximum capacity | 2     |

8. Create Auto Scaling group

Save the ASG name (`student-api-asg`) as the `ASG_NAME` secret in your repository.

> After creation:
> - The ASG launches one EC2 instance automatically
> - The instance runs the User Data script (Docker + AWS CLI install, ~2 min)
> - SSM registers the instance automatically (another ~1 min)
> - The ALB target group shows the instance as **unhealthy** because no container is running yet — this is expected. The first pipeline run will fix it.

**Deliverable:** ASG created, one EC2 instance running, instance visible in Systems Manager → Fleet Manager → Managed Nodes.

---

## Part B — OIDC (Keyless AWS Authentication)

### Task 8 — Create GitHub OIDC Trust

GitHub Actions authenticates to AWS using OpenID Connect. No access keys are stored anywhere.

Research: *"GitHub Actions OIDC AWS"*

#### Step 1 — Identity Provider

In **IAM → Identity providers → Add provider**:

| Field         | Value                                         |
|---------------|-----------------------------------------------|
| Provider type | OpenID Connect                                |
| Provider URL  | `https://token.actions.githubusercontent.com` |
| Audience      | `sts.amazonaws.com`                           |

#### Step 2 — IAM Role with Scoped Trust Policy

Create a new IAM Role (trusted entity: **Web identity**, provider: `token.actions.githubusercontent.com`).

Edit the trust policy to lock it to your repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<YOUR_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>:*"
        }
      }
    }
  ]
}
```

#### Step 3 — Permissions for the Role

Attach the following inline policy — only the exact actions the pipeline needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:*:<YOUR_ACCOUNT_ID>:repository/student-api"
    },
    {
      "Sid": "SSMDeploy",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:DescribeInstanceInformation"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ASGDescribe",
      "Effect": "Allow",
      "Action": "autoscaling:DescribeAutoScalingGroups",
      "Resource": "*"
    }
  ]
}
```

> `autoscaling:DescribeAutoScalingGroups` is required so the pipeline can discover which instance IDs are currently in-service before waiting for the SSM command to finish on each one.

**Deliverable:** Copy the Role ARN → add it as the `AWS_ROLE_ARN` secret.

---

## Part C — Local Docker Build

### Task 9 — Build and Test the Container

1. Copy `express-api/` into your repository and install dependencies:

   ```bash
   cd express-api
   npm install
   ```

   > **Important:** commit the generated `package-lock.json`. The Dockerfile uses `npm ci` which requires it. Without this file the Docker build will fail.

2. Build the image:

   ```bash
   docker build -t student-api:local .
   ```

3. Run and test:

   ```bash
   docker run -d -p 3000:3000 --name api-test student-api:local
   curl http://localhost:3000/health
   ```

4. Clean up:

   ```bash
   docker stop api-test && docker rm api-test
   ```

**Deliverable:** `GET /health` returns `{ "status": "ok" }`.

---

## Part D — GitHub Actions CI

### Task 10 — CI Pipeline

Create `.github/workflows/ci.yml`.

```
Lint
  ↓
Build Docker Image   (local only — no push yet)
```

Requirements:
- Trigger: `push` to `main` and `pull_request` to `main`
- `lint` job: `npm install` + `npm run lint` inside `express-api/`
- `build` job: depends on `lint`, runs `docker build -t ... ./express-api`

**Deliverable:** Green CI workflow in the Actions tab.

---

## Part E — Push to ECR

### Task 11 — Authenticate and Push

Update your workflow. Add the required top-level permissions block — OIDC does not work without it:

```yaml
permissions:
  id-token: write
  contents: read
```

Authentication:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: us-east-1
```

ECR login:

```yaml
- name: Login to ECR
  id: ecr-login
  uses: aws-actions/amazon-ecr-login@v2
```

Push with **two tags** — `latest` and `${{ github.sha }}`.

Save the full image URI as a job output so the `deploy` job can use it.

**Deliverable:** ECR shows both image tags after a push to `main`.

---

## Part F — Deployment

### Task 12 — Deploy via SSM to all ASG Instances

Add a `deploy` job. It targets **all in-service instances** in the ASG by tag — you never need to hardcode an instance ID.

#### Commands the EC2 instances run:

```bash
# 1 — Authenticate Docker to ECR using the instance's IAM role
aws ecr get-login-password --region <REGION> \
  | docker login --username AWS --password-stdin <ECR_REGISTRY>

# 2 — Pull the new image
docker pull <IMAGE>

# 3 — Stop and remove the old container
docker stop student-api 2>/dev/null || true
docker rm   student-api 2>/dev/null || true

# 4 — Start the new container on port 3000
docker run -d \
  --name student-api \
  --restart unless-stopped \
  -p 3000:3000 \
  <IMAGE>
```

#### Target all ASG instances by tag:

```bash
COMMAND_ID=$(aws ssm send-command \
  --targets       "Key=tag:aws:autoscaling:groupName,Values=${{ secrets.ASG_NAME }}" \
  --document-name "AWS-RunShellScript" \
  --parameters    "$PARAMS" \
  --query         "Command.CommandId" \
  --output        text)
```

> AWS automatically tags every ASG instance with `aws:autoscaling:groupName`. Using `--targets` instead of `--instance-ids` means the pipeline automatically covers all current and future instances — no changes needed when the ASG scales.

#### Wait for all instances:

```bash
# Discover which instances are currently in-service
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names "${{ secrets.ASG_NAME }}" \
  --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
  --output text)

# Wait for the SSM command to finish on each instance
for INSTANCE_ID in $INSTANCE_IDS; do
  echo "Waiting for $INSTANCE_ID..."
  aws ssm wait command-executed \
    --command-id  "<COMMAND_ID>" \
    --instance-id "$INSTANCE_ID"
done
```

**Tip:** Use `jq` (pre-installed on GitHub Actions runners) to build the `--parameters` JSON — it handles special characters in image URIs without quoting issues. See the solution workflow in `solution/.github/workflows/deploy.yml`.

**Deliverable:** Workflow completes. SSM command log on each instance shows all 5 Docker steps succeeding.

---

## Part G — Health Validation

### Task 13 — Automated Health Check via ALB

After deployment, poll `/health` through the ALB.

> **Timing note:** After the container restarts, the ALB runs its health checks. With the default 30-second interval and a threshold of 2 consecutive successes, it can take up to 90 seconds before the ALB routes traffic to the updated instance. Design your retry loop to wait at least 2 minutes.

Requirements:
- Poll `http://<ALB_DNS_NAME>/health`
- Retry up to 18 times with 10-second intervals
- Exit `0` on the first `200 OK` — print the live URL
- Exit `1` if all attempts fail

**Deliverable:** Pipeline ends with:

```
Health check passed on attempt N
Application is live at: http://<alb-dns-name>.elb.amazonaws.com
```

---

## Bonus Tasks

### Bonus 1 — Real `/version` Endpoint

Pass the commit SHA as a Docker build arg:

```bash
docker build --build-arg COMMIT_SHA="${{ github.sha }}" ...
```

The `Dockerfile` already accepts `ARG COMMIT_SHA=local`. The route already reads `process.env.COMMIT_SHA`.

**Deliverable:** `GET /version` returns the real 40-character SHA.

---

### Bonus 2 — Parallel Jobs

```
lint ──┐
       ├──▶  build-and-push  ──▶  deploy
test ──┘
```

Use `needs: [lint, test]` on `build-and-push`.

**Deliverable:** `lint` and `test` run simultaneously in the Actions tab.

---

### Bonus 3 — Build Metadata Artifact

Save deployment metadata as a workflow artifact after the push step:

```json
{
  "image":        "<ECR image URI with SHA tag>",
  "commit":       "<github.sha>",
  "pushed_at":    "<ISO 8601 timestamp>",
  "workflow_run": "<github.run_number>",
  "alb_url":      "http://<ALB_DNS_NAME>"
}
```

Upload with `actions/upload-artifact@v4`.

**Deliverable:** Downloadable `build-info` artifact on the workflow run.

---

### Bonus 4 — Self-Healing: Container on Fresh Instances

Currently, if the ASG replaces a failed instance, the new EC2 runs the User Data script (Docker + AWS CLI installed), but has no container running until the next `git push`.

Fix this by extending the User Data script to also pull and start the container on launch:

```bash
# After installing Docker and AWS CLI, add:
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${REGISTRY}/student-api:latest"

aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $REGISTRY

docker pull $IMAGE
docker run -d \
  --name student-api \
  --restart unless-stopped \
  -p 3000:3000 \
  $IMAGE
```

Update the Launch Template with a new version that includes this script.

> Note: this only works after the first pipeline run has pushed an image to ECR.

**Deliverable:** Terminate the running instance manually. The ASG replaces it. The new instance becomes healthy in the target group without any pipeline run.

---

## Architecture Reference

```
Developer Machine
        │
        │  git push
        ▼
  GitHub Repository
        │
        │  push event
        ▼
  GitHub Actions Runner
        │
        ├── lint
        │
        ├── OIDC → AssumeRole → AWS     (no static credentials)
        │              │
        │              ├── docker build --build-arg COMMIT_SHA
        │              ├── docker push :sha
        │              └── docker push :latest  ───────▶  ECR
        │
        ├── aws ssm send-command
        │         --targets tag:aws:autoscaling:groupName=student-api-asg
        │              │
        │     ┌────────┴─────────┐
        │     ▼                  ▼
        │  EC2 Instance A    EC2 Instance B     (SSM Agent, runs as root)
        │     │                  │
        │     ├── ecr login      ├── ecr login
        │     ├── docker pull    ├── docker pull
        │     ├── docker stop    ├── docker stop
        │     ├── docker rm      ├── docker rm
        │     └── docker run     └── docker run
        │          :3000              :3000
        │
        └── health check loop (retries every 10s, up to 3 min)
                    │
                    │  HTTP GET /health
                    ▼
        Application Load Balancer  (:80, alb-sg)
                    │
                    │  round-robin to :3000 (ec2-sg: alb-sg only)
                    ├──▶ EC2 A container
                    └──▶ EC2 B container

Final URL: http://<alb-dns-name>.us-east-1.elb.amazonaws.com
```

---

## Security Model

| Component              | Reachable from internet | How                                      |
|------------------------|-------------------------|------------------------------------------|
| ALB port 80            | Yes                     | `alb-sg` allows `0.0.0.0/0`             |
| EC2 port 3000          | No                      | `ec2-sg` allows only `alb-sg`           |
| EC2 port 22 (SSH)      | No                      | No inbound rule, no key pair             |
| EC2 management         | Via SSM Session Manager | SSM Agent → outbound HTTPS to AWS        |
| GitHub → AWS auth      | Via OIDC               | No static keys stored anywhere           |
| New instances          | Auto-provisioned       | ASG + Launch Template + User Data        |

---

## Concepts Covered

| Topic                      | What You Practiced                                                      |
|----------------------------|-------------------------------------------------------------------------|
| GitHub Actions             | Multi-job CI/CD pipeline with job outputs and dependencies              |
| OIDC                       | Passwordless AWS authentication from GitHub — no keys anywhere          |
| IAM Trust Policy           | Scoping which repository can assume the role                            |
| Docker                     | Build, tag (immutable SHA + mutable latest), push to registry          |
| ECR                        | AWS-managed private Docker registry                                     |
| Launch Template            | Infrastructure-as-code for EC2 configuration                           |
| User Data                  | Automatic bootstrapping of Docker + AWS CLI on every new instance      |
| Auto Scaling Group         | Self-healing fleet — replaces unhealthy instances automatically        |
| Security Groups            | ALB accepts internet, EC2 accepts only ALB                             |
| Application Load Balancer  | DNS-named entry point, health-aware traffic distribution               |
| Target Groups              | ALB routing to container port 3000 across all instances                |
| Systems Manager            | Remote command execution without SSH — targeting by ASG tag            |
| Health Checks              | Pipeline confirms the ALB routes to the updated container              |
| Image Tagging              | SHA tag for traceability, `latest` for self-healing bootstrapping      |
