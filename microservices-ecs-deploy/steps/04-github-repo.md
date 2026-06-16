# Step 4 — Prepare the GitHub repo

**Goal:** get your code into a standalone GitHub repo and wire up the one piece
of configuration the OIDC pipeline needs — the deploy role ARN, stored as a
repo **variable** (not a secret).

---

## Create a standalone repo

Copy the **contents** of this lab folder (not the folder itself, and not
`solution/`) into the root of a new repo. After copying,
`inventory-service/`, `orders-service/`, your `docker-compose.yml`, and your
`Dockerfile`s should sit at the repo root.

```bash
gh repo create <your-username>/microservices-ecs-deploy --private --clone
cd microservices-ecs-deploy
cp -r /path/to/this/lab/{inventory-service,orders-service,docker-compose.yml,.gitignore} .
# (your Dockerfiles live inside the *-service folders, so they come along)
git add . && git commit -m "feat: initial microservices-ecs-deploy" && git push
```

> Do **not** copy `solution/` into your repo. And confirm `.venv/` is not
> staged — `git status` should be clean of it thanks to `.gitignore`.

---

## OIDC means no stored access keys

The pipeline authenticates to AWS using **GitHub OIDC**: GitHub issues a
short-lived identity token, AWS verifies it against a trust policy, and hands
back temporary credentials. Nothing long-lived is ever stored in GitHub.

Your **instructor** provisions the AWS infrastructure and the IAM role, then
gives you these values:

| Name | Kind | Where it comes from |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Repo **variable** | IAM role ARN your instructor created for OIDC deploys |
| AWS region | Used in your workflow's `env:` | e.g. `eu-west-1` |
| ECS cluster name | Used in your workflow's `env:` | e.g. `microsvc-cluster` |
| ECR repo names | Used to build the image URI | `inventory-service`, `orders-service` |

The role ARN is **not a secret** — store it as a repo variable:

```bash
gh variable set AWS_DEPLOY_ROLE_ARN -b "<role-arn-from-instructor>"
```

> If you store it as a *secret* instead, `vars.AWS_DEPLOY_ROLE_ARN` in the
> workflow will be empty and the credentials step will fail. Use a **variable**.

---

## Checklist

- [ ] A standalone GitHub repo exists with the lab contents at its root
- [ ] `solution/` was **not** copied in
- [ ] No `.venv/`, `__pycache__/`, or `.pytest_cache/` committed
- [ ] **No AWS access keys** stored as GitHub secrets — OIDC only
- [ ] `AWS_DEPLOY_ROLE_ARN` is set as a repo **variable** (`gh variable list`)

Next: [Step 5 — Write the deploy pipeline](05-write-the-pipeline.md).
