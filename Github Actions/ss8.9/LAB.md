# Lab 9 — GitHub Actions → Docker Hub → ALB + ASG

**No SSH. No AWS Access Keys. No port 22.**

---

## Architecture

```
git push → GitHub Actions
               │
               ├─ [Lint + Type check + Tests (MongoDB service container)]
               │
               ├─ [docker push] ──────────→ Docker Hub (private repo)
               │
               └─ [OIDC → AWS]
                      │
                      ├─ Sync MONGODB_URI → SSM Parameter Store
                      │
                      └─ SSM SendCommand → ASG instances
                                │
                                ▼
                    EC2 reads creds from SSM Parameter Store
                    docker pull + docker run (with MONGODB_URI)
                                │
                         Application Load Balancer
                                │
                    http://<alb-dns-name>  ← public DNS name
```

## Application

The `express-api/` folder is a production-grade Node.js API:

```
express-api/
├── src/
│   ├── app.ts                  Express app (middleware, routes)
│   ├── server.ts               Entry point (connects DB, starts server)
│   ├── config/env.ts           Environment variable config
│   ├── db/connect.ts           Mongoose connection helper
│   ├── models/item.model.ts    Item schema (name, description, timestamps)
│   ├── routes/
│   │   ├── index.ts            Route aggregator
│   │   ├── health.ts           GET /, /health, /version
│   │   └── items.ts            Full CRUD: GET/POST /items, GET/PUT/DELETE /items/:id
│   └── middleware/
│       └── errorHandler.ts     Maps Mongoose errors to HTTP status codes
├── tests/
│   ├── setup.ts                Connects to test MongoDB before suite
│   ├── health.test.ts          Tests for /, /health, /version
│   └── items.test.ts           Tests for CRUD operations
├── Dockerfile                  Multi-stage: compile TS → minimal runtime image
├── tsconfig.json               NodeNext module resolution
└── vitest.config.ts            Test runner config
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | `{ message: 'Hello from student-api!' }` |
| `/health` | GET | `{ status, db, uptime }` — 503 if DB is down |
| `/version` | GET | `{ version, commit }` — shows deployed SHA |
| `/items` | GET | List all items (newest first) |
| `/items` | POST | Create item `{ name, description? }` |
| `/items/:id` | GET | Get item by MongoDB ObjectId |
| `/items/:id` | PUT | Update item |
| `/items/:id` | DELETE | Delete item (204 on success) |

**Create a new standalone GitHub repo for this lab.** Copy the contents of `express-api/` (not the folder itself) into the root of that repo. The workflows treat the repo root as the working directory — all source files, `package.json`, and `Dockerfile` live at root level, not inside a subdirectory.

```bash
# Create the repo and push the app code
gh repo create <your-username>/student-api --private --clone
cd student-api
cp -r /path/to/express-api/. .
mkdir -p .github/workflows
cp /path/to/solution/.github/workflows/ci.yml .github/workflows/
cp /path/to/solution/.github/workflows/deploy.yml .github/workflows/
git add . && git commit -m "feat: initial student-api" && git push
```

---

## Concepts Covered

| Concept | What you learn |
|---------|----------------|
| GitHub Actions multi-job pipelines | `needs`, job dependencies |
| Service containers | Running MongoDB alongside CI test jobs |
| Docker Hub | Private registry, access tokens, push/pull |
| AWS OIDC | Passwordless AWS auth from GitHub Actions |
| IAM Trust Policies | Scoping which repo can assume which role |
| SSM Parameter Store | GitOps-style secret sync: GitHub → AWS → EC2 |
| AWS Systems Manager | Remote command execution without SSH |
| EC2 Launch Templates | Auto-bootstrap Docker + AWS CLI on every new instance |
| Auto Scaling Groups | ELB health check type, self-healing |
| Application Load Balancer | Internet-facing, provides DNS name |
| TypeScript + Mongoose | Production API patterns |

---

## Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `AWS_ROLE_ARN` | Output of Task 11 (OIDC role ARN) |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `ASG_NAME` | Name you give the ASG in Task 10 |
| `ALB_DNS_NAME` | DNS name from the ALB in Task 9 |

---

## Part A — Docker Hub Setup

### Task 1 — Create a Docker Hub repository

1. Sign in at [hub.docker.com](https://hub.docker.com).
2. **Create Repository** → Name: `student-api` → Visibility: **Private** → Create.

Your image name will be: `<your-username>/student-api`

### Task 2 — Create a Docker Hub access token

1. Docker Hub → avatar → **Account Settings** → **Personal access tokens** → **Generate new token**.
2. Description: `student-api-deploy`, Permissions: **Read, Write, Delete**.
3. Copy the token immediately — it won't be shown again.

Add both as GitHub secrets:

```bash
gh secret set DOCKERHUB_USERNAME --repo <your-username>/student-api
gh secret set DOCKERHUB_TOKEN --repo <your-username>/student-api
```

---

## Part B — MongoDB Atlas

### Task 3 — Create a free MongoDB Atlas cluster

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a **free (M0) cluster** — any region, any provider.
3. **Database Access** → Add a database user (username + password).
4. **Network Access** → Add IP Address → **0.0.0.0/0** (allow anywhere — EC2 IPs are dynamic).
5. **Clusters** → **Connect** → **Drivers** → Copy the connection string.  
   Make sure the database name `student-api` is in the path:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/student-api?retryWrites=true&w=majority
   ```

Add it as GitHub secret `MONGODB_URI`:

```bash
gh secret set MONGODB_URI --repo <your-username>/student-api
```

> **How this flows at deploy time:**
> 1. The deploy workflow syncs `MONGODB_URI` to AWS SSM Parameter Store (encrypted).
> 2. Each EC2 instance reads it from SSM Parameter Store at deploy time using its IAM role.
> 3. The Docker container receives it as an environment variable.
> No MongoDB credentials are baked into your Docker image or EC2 instance.

---

## Part C — AWS Infrastructure

> All CLI commands below use `us-east-1`. If you use a different region, replace it everywhere.

### Get your VPC and subnet IDs first

Every resource below lives in the same VPC. Run this once and keep the output:

```bash
# Default VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" --output text)
echo "VPC_ID=$VPC_ID"

# Default public subnets (need at least 2 AZs for ALB)
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=default-for-az,Values=true" \
  --query "Subnets[].[SubnetId,AvailabilityZone]" \
  --output table
```

Pick at least 2 subnet IDs from different AZs. You'll use them in Tasks 9 and 10.

---

### Task 4 — Security Groups

**Create `alb-sg` (for the Load Balancer):**

```bash
ALB_SG=$(aws ec2 create-security-group \
  --group-name alb-sg \
  --description "ALB security group for student-api" \
  --vpc-id $VPC_ID \
  --query "GroupId" --output text)
echo "ALB_SG=$ALB_SG"

# Allow HTTP from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
```

**Create `ec2-sg` (for EC2 instances):**

```bash
EC2_SG=$(aws ec2 create-security-group \
  --group-name ec2-sg \
  --description "EC2 security group for student-api" \
  --vpc-id $VPC_ID \
  --query "GroupId" --output text)
echo "EC2_SG=$EC2_SG"

# Allow port 3000 ONLY from the ALB security group
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp --port 3000 \
  --source-group $ALB_SG
```

> No port 22. No port 80 on EC2. Port 3000 is only reachable from the ALB. The default outbound `All traffic` rule allows SSM Agent to call AWS endpoints and Docker to pull images.

**Verify:**
```bash
aws ec2 describe-security-groups \
  --group-ids $ALB_SG $EC2_SG \
  --query "SecurityGroups[].[GroupName,IpPermissions[*].[IpProtocol,FromPort,IpRanges[*].CidrIp,UserIdGroupPairs[*].GroupId]]" \
  --output table
```

---

### Task 5 — EC2 IAM Role

**Create the role:**

```bash
aws iam create-role \
  --role-name student-api-ec2-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

**Attach SSM managed policy (allows SSM Agent to function):**

```bash
aws iam attach-role-policy \
  --role-name student-api-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
```

**Add inline policy to read SSM Parameter Store secrets:**

```bash
aws iam put-role-policy \
  --role-name student-api-ec2-role \
  --policy-name StudentApiParameterStoreRead \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": "arn:aws:ssm:*:*:parameter/student-api/*"
    }]
  }'
```

**Create the instance profile** (EC2 requires a profile wrapper around the role — the console creates this automatically; the CLI requires it manually):

```bash
aws iam create-instance-profile \
  --instance-profile-name student-api-ec2-role

aws iam add-role-to-instance-profile \
  --instance-profile-name student-api-ec2-role \
  --role-name student-api-ec2-role
```

Wait ~10 seconds for IAM to propagate before continuing.

---

### Task 6 — Store Docker Hub credentials in SSM Parameter Store

> The MongoDB URI is synced automatically by the deploy pipeline. Store Docker Hub credentials once manually.

```bash
aws ssm put-parameter \
  --name /student-api/dockerhub/username \
  --value "<your-dockerhub-username>" \
  --type String \
  --overwrite \
  --region us-east-1

aws ssm put-parameter \
  --name /student-api/dockerhub/token \
  --value "<your-dockerhub-token>" \
  --type SecureString \
  --overwrite \
  --region us-east-1
```

The pipeline will create `/student-api/mongodb/uri` automatically on first deploy.

**Verify:**
```bash
aws ssm get-parameter --name /student-api/dockerhub/username --query "Parameter.Value" --output text
aws ssm get-parameter --name /student-api/dockerhub/token --with-decryption --query "Parameter.Value" --output text
```

---

### Task 7 — Launch Template

Get the latest Ubuntu 22.04 LTS AMI:

```bash
AMI=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text)
echo "AMI=$AMI"
```

Create the launch template with user data that:
1. Installs Docker and AWS CLI v2
2. Auto-starts the app on launch (self-heal — new instances bootstrap without a pipeline run)

```bash
USER_DATA=$(base64 <<'USERDATA'
#!/bin/bash
set -e

apt-get update -y
apt-get install -y docker.io unzip curl jq

systemctl start docker
systemctl enable docker

# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
  -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

# Self-heal: pull and run latest image when this instance launches
REGION="us-east-1"
DH_USER=$(aws ssm get-parameter --region "$REGION" \
  --name /student-api/dockerhub/username --query Parameter.Value --output text)
DH_TOKEN=$(aws ssm get-parameter --region "$REGION" \
  --name /student-api/dockerhub/token --with-decryption --query Parameter.Value --output text)
MONGO_URI=$(aws ssm get-parameter --region "$REGION" \
  --name /student-api/mongodb/uri --with-decryption --query Parameter.Value \
  --output text 2>/dev/null || echo "")

echo "$DH_TOKEN" | docker login --username "$DH_USER" --password-stdin

if [ -n "$MONGO_URI" ]; then
  docker run -d --name student-api --restart unless-stopped \
    -p 3000:3000 \
    -e MONGODB_URI="$MONGO_URI" \
    "$DH_USER/student-api:latest" || true
fi
USERDATA
)

aws ec2 create-launch-template \
  --launch-template-name student-api-lt \
  --version-description "v1" \
  --launch-template-data "{
    \"ImageId\": \"$AMI\",
    \"InstanceType\": \"t3.micro\",
    \"IamInstanceProfile\": {\"Name\": \"student-api-ec2-role\"},
    \"SecurityGroupIds\": [\"$EC2_SG\"],
    \"UserData\": \"$USER_DATA\"
  }"
```

> The self-heal block runs at launch. If `/student-api/mongodb/uri` doesn't exist yet (before first deploy), it skips `docker run` gracefully. After the first pipeline push, all future replacement instances start automatically without any human intervention.

---

### Task 8 — Target Group

```bash
TG_ARN=$(aws elbv2 create-target-group \
  --name student-api-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --target-type instance \
  --query "TargetGroups[0].TargetGroupArn" --output text)
echo "TG_ARN=$TG_ARN"
```

---

### Task 9 — Application Load Balancer

Replace `subnet-xxx` and `subnet-yyy` with at least 2 public subnet IDs from different AZs (from the query you ran earlier):

```bash
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name student-api-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --query "LoadBalancers[0].LoadBalancerArn" --output text)
echo "ALB_ARN=$ALB_ARN"

# Get the DNS name — this becomes the ALB_DNS_NAME secret
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" --output text)
echo "ALB_DNS=$ALB_DNS"

# Add listener: HTTP :80 → target group
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

Add the DNS name as a GitHub secret:

```bash
gh secret set ALB_DNS_NAME --repo <your-username>/student-api --body "$ALB_DNS"
```

---

### Task 10 — Auto Scaling Group

Use the same subnet IDs as the ALB:

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name student-api-asg \
  --launch-template "LaunchTemplateName=student-api-lt,Version=\$Latest" \
  --min-size 1 \
  --max-size 2 \
  --desired-capacity 1 \
  --vpc-zone-identifier "subnet-xxx,subnet-yyy" \
  --target-group-arns $TG_ARN \
  --health-check-type ELB \
  --health-check-grace-period 120 \
  --tags "Key=Name,Value=student-api,PropagateAtLaunch=true"

gh secret set ASG_NAME --repo <your-username>/student-api --body "student-api-asg"
```

> **Health check grace period = 120 seconds.** This gives the instance time to install Docker, pull the image, and start the container before ELB health checks can terminate it.

---

## Part D — GitHub OIDC

### Task 11 — OIDC Provider and IAM Role

**Step 1 — Add GitHub OIDC identity provider** (skip if it already exists in your account):

```bash
# Check if it already exists
aws iam list-open-id-connect-providers \
  --query "OpenIDConnectProviderList[*].Arn" --output text

# If not listed, create it
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

> The thumbprint `6938fd4d98bab03faadb97b34396831e3780aea1` is GitHub's well-known value. AWS now validates the OIDC provider by audience, not thumbprint, so this value is accepted regardless.

**Step 2 — Get your account ID:**

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "ACCOUNT_ID=$ACCOUNT_ID"
```

**Step 3 — Create the IAM role** (replace `<GITHUB_USERNAME>` with your GitHub username):

```bash
aws iam create-role \
  --role-name student-api-github-actions-role \
  --assume-role-policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Principal\": {
        \"Federated\": \"arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com\"
      },
      \"Action\": \"sts:AssumeRoleWithWebIdentity\",
      \"Condition\": {
        \"StringEquals\": {
          \"token.actions.githubusercontent.com:aud\": \"sts.amazonaws.com\"
        },
        \"StringLike\": {
          \"token.actions.githubusercontent.com:sub\": \"repo:<GITHUB_USERNAME>/student-api:*\"
        }
      }
    }]
  }"
```

**Step 4 — Attach permissions policy:**

```bash
aws iam put-role-policy \
  --role-name student-api-github-actions-role \
  --policy-name StudentApiDeployPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "SSMDeploy",
        "Effect": "Allow",
        "Action": [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssm:ListCommandInvocations"
        ],
        "Resource": "*"
      },
      {
        "Sid": "SSMConfig",
        "Effect": "Allow",
        "Action": "ssm:PutParameter",
        "Resource": "arn:aws:ssm:*:*:parameter/student-api/*"
      },
      {
        "Sid": "ASGDescribe",
        "Effect": "Allow",
        "Action": "autoscaling:DescribeAutoScalingGroups",
        "Resource": "*"
      }
    ]
  }'
```

**Step 5 — Get the Role ARN and add as GitHub secret:**

```bash
ROLE_ARN=$(aws iam get-role \
  --role-name student-api-github-actions-role \
  --query "Role.Arn" --output text)
echo "ROLE_ARN=$ROLE_ARN"

gh secret set AWS_ROLE_ARN --repo <your-username>/student-api --body "$ROLE_ARN"
```

**Verify all 6 secrets are set:**

```bash
gh secret list --repo <your-username>/student-api
```

Expected output:
```
ALB_DNS_NAME      ...
ASG_NAME          ...
AWS_ROLE_ARN      ...
DOCKERHUB_TOKEN   ...
DOCKERHUB_USERNAME ...
MONGODB_URI       ...
```

---

## Part E — Local Development

### Task 12 — Run the API locally

```bash
cd express-api
npm install

# Requires a running MongoDB (local or Atlas)
export MONGODB_URI="mongodb://localhost:27017/student-api-dev"
npm run dev
```

Test endpoints:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/items
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"my first item","description":"testing"}'
curl http://localhost:3000/items
```

Run tests (needs a MongoDB):
```bash
# Spin up a local MongoDB with Docker:
docker run -d --name test-mongo -p 27017:27017 mongo:7

MONGODB_URI="mongodb://localhost:27017/test" npm test
```

---

## Part F — CI Pipeline

### Task 13 — Create `.github/workflows/ci.yml`

The CI pipeline runs on every push and pull request with three jobs:

**`lint`** — ESLint + TypeScript type check  
**`test`** — spins up a MongoDB 7 service container, runs `npm test`  
**`build`** — Docker build without push (verifies Dockerfile)

The test job uses a GitHub Actions **service container**:
```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - 27017:27017
```

Tests connect to `mongodb://localhost:27017/student-api-test` — fully isolated, no Atlas account needed for CI.

See `solution/.github/workflows/ci.yml` for the complete file.

> **Why do both `ci.yml` and `deploy.yml` run on push to `main`?** This is intentional. `ci.yml` covers both PRs and main pushes for fast feedback. `deploy.yml` runs only on main pushes and does the actual deployment. On a push to main, both run in parallel and lint/test are duplicated — this is acceptable overhead. In production you would typically skip the CI workflow on main or merge them.

---

## Part G — Push to Docker Hub

### Task 14 — Create `.github/workflows/deploy.yml` — build and push job

The `build-and-push` job:
1. Logs in with `docker/login-action@v3`
2. Builds with `--build-arg COMMIT_SHA=${{ github.sha }}` (embedded in the image)
3. Tags as `<username>/student-api:<sha>` + `<username>/student-api:latest`
4. Pushes both tags

> **Do not use a job `output` to pass the image name to the deploy job.** GitHub Actions silently suppresses any job output whose value matches a registered secret. Since the image name contains `DOCKERHUB_USERNAME`, the output is swallowed and the deploy job receives an empty string. Instead, reconstruct the image name directly in the deploy job:
> ```yaml
> IMAGE="${{ secrets.DOCKERHUB_USERNAME }}/student-api:${{ github.sha }}"
> ```

---

## Part H — Deploy via SSM

### Task 15 — Complete `deploy.yml` — deploy job

**Secret sync step:** Before sending the SSM command, the pipeline syncs your `MONGODB_URI` GitHub secret to AWS SSM Parameter Store:

```yaml
- name: Sync MongoDB URI to SSM Parameter Store
  run: |
    aws ssm put-parameter \
      --name /student-api/mongodb/uri \
      --value "${{ secrets.MONGODB_URI }}" \
      --type SecureString \
      --overwrite
```

This is **GitOps for secrets** — the deploy pipeline is the source of truth for secrets, keeping GitHub and AWS in sync automatically.

**First deploy on a fresh instance — timing note:**

When the ASG launches a new EC2 instance, the user data script takes 3–5 minutes to install Docker and AWS CLI. SSM Agent is pre-installed on Ubuntu 22.04 and starts immediately, so it can receive Run Commands before user data finishes. To prevent the deploy script from failing with `aws: not found`, add wait loops at the top of the SSM command script:

```bash
# Wait for user data to finish installing AWS CLI and Docker
for i in $(seq 1 30); do /usr/local/bin/aws --version >/dev/null 2>&1 && break; echo "Waiting for AWS CLI... $i/30"; sleep 10; done
export PATH=$PATH:/usr/local/bin
for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; echo "Waiting for Docker... $i/30"; sleep 10; done
```

**SSM race condition — always capture instance IDs before `send-command`:**

The wait step must poll the same instances the command was sent to. If you query ASG InService instances separately (after sending the command), the ASG may have rotated an instance between the two calls, causing `InvocationDoesNotExist`. Capture IDs once, use the same list for both:

```bash
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups ...)
aws ssm send-command --instance-ids $INSTANCE_IDS ...
# then poll using the same $INSTANCE_IDS
```

**`aws ssm wait command-executed` times out after 100 seconds.** On a fresh instance, the deploy script waits for user data (3-5 min) before it can run. Use a manual polling loop instead:

```bash
for attempt in $(seq 1 60); do
  STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query "Status" --output text 2>/dev/null || echo "Pending")
  [ "$STATUS" = "Success" ] && break
  [ "$STATUS" = "Failed" ] && exit 1
  sleep 10
done
```

**Trigger a full pipeline run:**

Push a commit to `main`. Watch all jobs run:

```
lint → test → build-and-push → deploy
```

Once you see:
```
Healthy at: http://<your-alb-dns>
```

Test it end-to-end:
```bash
curl http://<ALB_DNS_NAME>/health
# {"status":"ok","db":"connected","uptime":42}

curl -X POST http://<ALB_DNS_NAME>/items \
  -H "Content-Type: application/json" \
  -d '{"name":"deployed item","description":"created via ALB"}'

curl http://<ALB_DNS_NAME>/version
# {"version":"1.0","commit":"<your-git-sha>"}
```

---

## Verification Checklist

- [ ] `gh secret list` shows all 6 secrets
- [ ] Docker Hub shows `<username>/student-api` with `:<sha>` and `:latest` tags
- [ ] ALB DNS responds on port 80 (not 3000)
- [ ] `GET /health` returns `{"status":"ok","db":"connected",...}`
- [ ] `GET /version` shows the commit SHA matching the latest GitHub push
- [ ] Items persist across requests (MongoDB is connected)
- [ ] CI `test` job passes (green service container tests)
- [ ] No port 22 in `ec2-sg` inbound rules
- [ ] No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in GitHub secrets
- [ ] `GET /health` returns 503 if you disconnect from Atlas temporarily

---

## Bonus Tasks

### Bonus 1 — Rolling deploy with zero downtime

The current deploy sends the SSM command to all instances simultaneously, causing a brief period where containers are restarting. To get true rolling deployment:

1. Scale the ASG to desired=2
2. Modify the deploy job to update instances one at a time:
   - Get instance IDs from ASG
   - For each instance: deregister from target group → wait → deploy → re-register → wait for healthy → move to next
3. The ALB routes only to healthy, registered instances throughout

What AWS permissions does this require? Which deregister/register API calls do you need?

### Bonus 2 — Health check shows MongoDB details

Update `GET /health` to return more diagnostics:

```json
{
  "status": "ok",
  "db": "connected",
  "dbName": "student-api",
  "uptime": 142,
  "items": 5
}
```

The `items` count requires a Mongoose query inside the health handler. Consider the performance implications — would you do this in a real production system?

### Bonus 3 — Slack notification on deploy

```yaml
- name: Notify Slack
  if: success()
  run: |
    curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"Deployed \`${{ github.sha }}\` to http://${{ secrets.ALB_DNS_NAME }} :rocket:\"}"
```

---

## Secret flow summary

```
GitHub Secrets (CI machine)              AWS SSM Parameter Store (runtime)
──────────────────────────               ─────────────────────────────────
DOCKERHUB_USERNAME  ─► push image        /student-api/dockerhub/username  ─┐
DOCKERHUB_TOKEN     ─► push image        /student-api/dockerhub/token     ─┤─► EC2 reads at deploy
AWS_ROLE_ARN        ─► OIDC auth         /student-api/mongodb/uri         ─┘
MONGODB_URI         ─► synced to SSM ──►   (synced by deploy pipeline)
ASG_NAME            ─► SSM target
ALB_DNS_NAME        ─► health check

No AWS keys in GitHub. No credentials in EC2 User Data. No SSH. No port 22.
```
