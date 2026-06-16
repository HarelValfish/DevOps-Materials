# Step 03 — Run both locally with Compose

**Goal:** write `docker-compose.yml` **yourself** that runs both containers
together and proves the cross-service call works locally — the same dependency
you'll later prove in production.

No compose file is provided — you write `docker-compose.yml` at the **repo
root**.

---

## A. Requirements

Your `docker-compose.yml` must define two services:

- [ ] **`inventory`** — built from `./inventory-service`. It does **not** need
      to publish a port to the host; only `orders` talks to it.
- [ ] **`orders`** — built from `./orders-service`. It must:
  - [ ] publish `8080:8080` so you can curl it from your host
  - [ ] set the environment variable `INVENTORY_URL=http://inventory:8080`
  - [ ] `depends_on` the `inventory` service

> **Why `http://inventory:8080`?** Compose puts both containers on one network
> and gives each a DNS name equal to its service name. So `orders` reaches
> `inventory` at the hostname `inventory`. This mirrors ECS Service Connect,
> where the same call becomes `http://inventory.microsvc.local:8080`. Same
> idea, different DNS namespace.

Giving a container an explicit `container_name` is optional but makes logs
easier to read.

*Self-check questions:*
- Why does `inventory` **not** publish a host port, while `orders` does?
- If you renamed the `inventory` service, what else would have to change?

---

## B. Run it

```bash
docker compose up --build -d

curl -sX POST localhost:8080/orders -H 'content-type: application/json' \
     -d '{"sku":"widget","quantity":2}'    # expect status "confirmed"
curl -sX POST localhost:8080/orders -H 'content-type: application/json' \
     -d '{"sku":"gadget","quantity":2}'    # expect status "backordered"

docker compose logs orders                 # see the request hit inventory
docker compose down
```

`widget` has quantity 10 (≥ 2 → **confirmed**); `gadget` has quantity 0
(< 2 → **backordered**). If both behave as described, your two containers are
talking to each other over the compose network.

---

## C. Prove the dependency locally (optional but recommended)

Stop just inventory and watch orders fail loudly:

```bash
docker compose up --build -d
docker compose stop inventory
curl -isX POST localhost:8080/orders -H 'content-type: application/json' \
     -d '{"sku":"widget","quantity":1}'    # expect HTTP 503
docker compose down
```

This is the exact failure mode you'll reproduce in production in
[Step 06](06-deploy-and-verify.md). If it does **not** return `503`, your
`orders` app is swallowing the connection error instead of surfacing it.

---

## What you learned

- Containers reach each other by **service name** on the compose network — the
  same name-as-hostname idea ECS Service Connect uses. Proving the cross-service
  call (and its failure mode) locally means every later failure is a deploy
  problem, not an app problem.

## Checklist

- [ ] `docker-compose.yml` exists at the repo root with `inventory` + `orders`
- [ ] `orders` has `INVENTORY_URL`, `depends_on: [inventory]`, and publishes `8080`
- [ ] `inventory` does **not** publish a host port
- [ ] `widget` → `confirmed`, `gadget` → `backordered`
- [ ] Stopping inventory makes `/orders` return `503`

## Next

→ [Step 04 — Prepare the GitHub repo](04-github-repo.md)
