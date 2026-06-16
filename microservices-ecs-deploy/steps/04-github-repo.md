# Step 04 — Prepare the GitHub repo

**Goal:** get your code into a standalone GitHub repo and wire up the one piece
of configuration the OIDC pipeline needs — the deploy role ARN, stored as a
repo **variable** (not a secret).

---

## A. Create a standalone repo

Put your lab — both `*-service/` folders (with the `Dockerfile`s you wrote),
your `docker-compose.yml`, and `.gitignore` — at the root of a new repo.

```bash
gh repo create <your-username>/microservices-ecs-deploy --private --clone
cd microservices-ecs-deploy
# copy your work in so it sits at the repo root:
cp -r /path/to/your/lab/{inventory-service,orders-service,docker-compose.yml,.gitignore} .
# (your Dockerfiles live inside the *-service folders, so they come along)
git add . && git commit -m "feat: initial microservices-ecs-deploy" && git push
```

> Confirm `.venv/` is not staged — `git status` should be clean of it thanks to
> `.gitignore`.

---

## B. OIDC means no stored access keys

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

*Self-check questions:*
- Why is a role ARN safe to store as a *variable* and not a secret?
- What does OIDC give you that a stored `AWS_ACCESS_KEY_ID` / `SECRET` pair
  does not?

---

## What you learned

- OIDC replaces long-lived AWS access keys with short-lived, per-run tokens —
  nothing secret-shaped ever lives in GitHub. The role ARN is just an
  identifier, so it lives as a plain repo variable.

## Checklist

- [ ] A standalone GitHub repo exists with the lab contents at its root
- [ ] No `.venv/`, `__pycache__/`, or `.pytest_cache/` committed
- [ ] **No AWS access keys** stored as GitHub secrets — OIDC only
- [ ] `AWS_DEPLOY_ROLE_ARN` is set as a repo **variable** (`gh variable list`)

## Next

→ [Step 05 — Write the deploy pipeline](05-write-the-pipeline.md)
