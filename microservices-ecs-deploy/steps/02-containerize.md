# Step 02 — Containerize each service

**Goal:** write a `Dockerfile` for `inventory-service` and another for
`orders-service` **yourself**, build an image for each, and smoke-test that they
run.

No `Dockerfile` is provided — this is the exercise. You create
`inventory-service/Dockerfile` and `orders-service/Dockerfile`. Both services
are the same shape, so the two files will look nearly identical.

> **Set up:** each `Dockerfile` goes **inside its service folder**, next to that
> service's `requirements.txt` and `app.py`, and you build from there.

---

## A. Requirements for each Dockerfile

Each `Dockerfile` must:

- [ ] Start `FROM python:3.12-slim` (match the version you used locally)
- [ ] Set a working directory inside the image (e.g. `/app`)
- [ ] Copy `requirements.txt` **first**, then `pip install -r requirements.txt`,
      then copy `app.py` — so dependency layers stay cached when only the app
      code changes
- [ ] Install with `--no-cache-dir` to keep the image small
- [ ] `EXPOSE 8080`
- [ ] Start the app with **gunicorn**, not the Flask dev server

**The one fixed piece — how to start the app.** Inside the container the app is
launched with gunicorn:

```
gunicorn --bind 0.0.0.0:8080 app:app
```

> `gunicorn` is already in both `requirements.txt`. The Flask dev server
> (`python app.py`) is fine for local poking but must never serve in a
> container that ships to ECS.

*Self-check questions:*
- Why copy `requirements.txt` and install **before** `COPY app.py`? (What does
  it do to rebuild times when you change only source code?)
- Why does `--no-cache-dir` make the image smaller?
- Why gunicorn instead of the Flask dev server in a shipped container?

---

## B. Why copy `requirements.txt` before `app.py`?

Docker caches each layer. If you copy everything at once, any change to
`app.py` busts the `pip install` layer and re-downloads every dependency. By
copying and installing requirements **before** the source, the (slow) install
layer is reused on every build where the dependencies didn't change.

---

## C. Build and smoke-test each image

```bash
docker build -t inventory-service ./inventory-service
docker run --rm -p 8080:8080 inventory-service &
curl -s localhost:8080/health        # {"status":"ok"}
curl -s localhost:8080/stock/widget  # {"sku":"widget","quantity":10}
docker stop $(docker ps -q --filter ancestor=inventory-service)
```

Do the same for `orders-service` (its `/orders` route will 503 on its own —
it has no inventory to call yet; that's expected until [Step 03](03-compose-local.md)).

```bash
docker build -t orders-service ./orders-service
```

---

## What you learned

- A `Dockerfile` is an ordered set of instructions; ordering deps before code
  gives fast, cached rebuilds. Running a real WSGI server (gunicorn) instead of
  the dev server is the difference between a toy and something you'd ship.

## Checklist

- [ ] `inventory-service/Dockerfile` exists and `docker build` succeeds
- [ ] `orders-service/Dockerfile` exists and `docker build` succeeds
- [ ] Running the inventory image responds on `/health` and `/stock/widget`
- [ ] Both images run **gunicorn**, not the Flask dev server

## Next

→ [Step 03 — Run both locally with Compose](03-compose-local.md)
