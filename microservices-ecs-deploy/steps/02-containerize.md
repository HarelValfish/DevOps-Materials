# Step 2 — Containerize each service

**Goal:** write a `Dockerfile` for `inventory-service` and another for
`orders-service` so each can run as a container.

No Dockerfile is provided — this is part of the exercise. Create
`inventory-service/Dockerfile` and `orders-service/Dockerfile` yourself.

---

## Requirements for each Dockerfile

Both services are the same shape, so the two Dockerfiles will look nearly
identical. Each must:

- [ ] Start `FROM python:3.12-slim` (match the version you used locally)
- [ ] Set a working directory inside the image (e.g. `/app`)
- [ ] Copy `requirements.txt` **first**, then `pip install -r requirements.txt`,
      then copy `app.py` — so dependency layers stay cached when only the app
      code changes
- [ ] Install with `--no-cache-dir` to keep the image small
- [ ] `EXPOSE 8080`
- [ ] Start the app with **gunicorn**, not the Flask dev server:
      `gunicorn --bind 0.0.0.0:8080 app:app`

> `gunicorn` is already in both `requirements.txt`. The Flask dev server
> (`python app.py`) is fine for local poking but must never serve in a
> container that ships to ECS.

---

## Why copy `requirements.txt` before `app.py`?

Docker caches each layer. If you copy everything at once, any change to
`app.py` busts the `pip install` layer and re-downloads every dependency. By
copying and installing requirements **before** the source, the (slow) install
layer is reused on every build where the dependencies didn't change.

---

## Build and smoke-test each image

```bash
docker build -t inventory-service ./inventory-service
docker run --rm -p 8080:8080 inventory-service &
curl -s localhost:8080/health        # {"status":"ok"}
curl -s localhost:8080/stock/widget  # {"sku":"widget","quantity":10}
docker stop $(docker ps -q --filter ancestor=inventory-service)
```

Do the same for `orders-service` (its `/orders` route will 503 on its own —
it has no inventory to call yet; that's expected until [Step 3](03-compose-local.md)).

```bash
docker build -t orders-service ./orders-service
```

---

## Checklist

- [ ] `inventory-service/Dockerfile` exists and `docker build` succeeds
- [ ] `orders-service/Dockerfile` exists and `docker build` succeeds
- [ ] Running the inventory image responds on `/health` and `/stock/widget`
- [ ] Both images run **gunicorn**, not the Flask dev server

Stuck? `solution/inventory-service/Dockerfile` is the reference — try writing
yours first.

Next: [Step 3 — Run both locally with Compose](03-compose-local.md).
