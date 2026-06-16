# Lab — Microservices to ECS/ECR via GitHub Actions (OIDC)

**No SSH. No AWS Access Keys.**

You will take two Flask microservices that depend on each other, containerize
them, run them together locally, and ship them to **Amazon ECS Fargate** through
a **GitHub Actions** pipeline that authenticates to AWS with **OIDC** — no
stored access keys anywhere.

---

## Architecture

```
git push → GitHub Actions (matrix: inventory, orders)
               │
               ├─ [OIDC → AWS, no stored keys]
               │
               ├─ [docker build + push] ──────→ Amazon ECR (one repo per service)
               │
               └─ [render + deploy task def] ──→ Amazon ECS Fargate
                                                       │
                                          inventory-service   orders-service
                                          (no public access)  (behind the ALB)
                                                   ▲                  │
                                                   └── Service Connect ┘
                                                       inventory.microsvc.local:8080
                                                                       │
                                                       Application Load Balancer
                                                                       │
                                                       http://<alb-dns-name>/orders
```

`orders-service` cannot answer a request without calling `inventory-service`
over `INVENTORY_URL`. That's the dependency you're proving end-to-end once
this is deployed.

---

## What's provided vs. what you write

You are **given** the application code so the lab stays focused on
containerization and deployment, not on writing Flask:

```
inventory-service/
├── app.py                  GET /health, GET /stock/<sku>
├── requirements.txt
├── task-definition.json    ECS Fargate task definition (ARNs templated)
└── tests/test_app.py

orders-service/
├── app.py                  GET /health, POST /orders → calls inventory over HTTP
├── requirements.txt
├── task-definition.json
└── tests/test_app.py
```

| Service | Endpoint | Description |
|---|---|---|
| inventory | `GET /health` | `{"status": "ok"}` |
| inventory | `GET /stock/<sku>` | `{"sku": ..., "quantity": ...}` — `0` for unknown SKUs |
| orders | `GET /health` | `{"status": "ok"}` |
| orders | `POST /orders` `{"sku": ..., "quantity": ...}` | Calls inventory, returns `"confirmed"` / `"backordered"`, or `503` if inventory is unreachable |

You will **write yourself**:

- A `Dockerfile` for each service → [Step 02](steps/02-containerize.md)
- `docker-compose.yml` to run both together → [Step 03](steps/03-compose-local.md)
- `.github/workflows/deploy.yml`, the OIDC deploy pipeline → [Step 05](steps/05-write-the-pipeline.md)

---

## Steps

| # | Step | What you do |
|---|---|---|
| 1 | [Local development setup](steps/01-local-dev-setup.md) | Create a virtualenv per service, install deps, run the tests |
| 2 | [Containerize each service](steps/02-containerize.md) | Write a `Dockerfile` for inventory and orders |
| 3 | [Run both locally with Compose](steps/03-compose-local.md) | Write `docker-compose.yml`, prove the cross-service call |
| 4 | [Prepare the GitHub repo](steps/04-github-repo.md) | Standalone repo, OIDC config, repo variable |
| 5 | [Write the deploy pipeline](steps/05-write-the-pipeline.md) | Author `.github/workflows/deploy.yml` (the core exercise) |
| 6 | [Deploy & verify end-to-end](steps/06-deploy-and-verify.md) | Push, watch the run, hit the ALB, prove the dependency |

Work through them in order. Each step ends with a checklist; don't move on
until it passes.

---

## Concepts Covered

| Concept | What you learn |
|---|---|
| Python virtualenvs | Isolated, reproducible per-service dependencies |
| Dockerfiles | Containerizing a Python web service from scratch |
| Docker Compose | Wiring multiple services together for local dev |
| GitHub OIDC | Passwordless AWS auth from GitHub Actions — no stored access keys |
| IAM trust policies | Scoping which repo + branch can assume which role |
| Amazon ECR | Per-service container registries, commit-SHA image tags |
| Amazon ECS Fargate | Serverless container orchestration |
| ECS Service Connect | Service-to-service discovery via a private Cloud Map DNS namespace |
| Render + deploy task definitions | Declarative, idempotent ECS deploys from a JSON template |
| GitHub Actions matrix | Two services deployed independently in the same workflow |
| Application Load Balancer | Only the public-facing service is exposed; the internal one isn't |

---

## Verification Checklist (whole lab)

- [ ] A virtualenv exists per service and both test suites pass ([Step 1](steps/01-local-dev-setup.md))
- [ ] You wrote a `Dockerfile` for each service ([Step 2](steps/02-containerize.md))
- [ ] `docker compose up` proves the cross-service call works locally ([Step 3](steps/03-compose-local.md))
- [ ] No AWS access keys exist as GitHub secrets — OIDC only ([Step 4](steps/04-github-repo.md))
- [ ] You wrote `.github/workflows/deploy.yml` from scratch ([Step 5](steps/05-write-the-pipeline.md))
- [ ] A push to `main` runs your workflow; both matrix jobs go green independently ([Step 6](steps/06-deploy-and-verify.md))
- [ ] `aws ecs describe-services` shows both services with `running == desired`
- [ ] The ALB returns `confirmed` / `backordered` correctly through the real deployment
