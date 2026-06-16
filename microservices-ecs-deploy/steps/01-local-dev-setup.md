# Step 1 — Local development setup

**Goal:** get both services' dependencies installed in isolated virtual
environments and confirm every test passes — before you touch Docker or AWS.

You are given `app.py`, `requirements.txt`, and `tests/` for each service.
Nothing here requires writing code; you're setting up a clean, reproducible
local environment.

---

## Why a virtualenv?

Each service declares its own `requirements.txt`. Installing those into your
global Python pollutes your system and makes "works on my machine" bugs. A
**virtual environment** is a throwaway, per-project Python with its own
isolated `site-packages`. We create one **per service** so the two services'
dependency sets never collide.

> The `.venv/` directories are already in `.gitignore` — never commit them.

---

## inventory-service

> Python 3.12 is assumed (matches the container base image). Use `python3` on
> macOS/Linux if `python` points at Python 2.

### macOS / Linux (bash)

```bash
cd inventory-service

python -m venv .venv             # create the virtualenv
source .venv/bin/activate        # activate it (prompt shows (.venv))
pip install -r requirements.txt  # install deps INTO the venv
pytest -q                        # expect: 3 passed

deactivate                       # leave the venv when done
cd ..
```

### Windows (PowerShell)

```powershell
cd inventory-service

python -m venv .venv
.\.venv\Scripts\Activate.ps1     # if blocked: Set-ExecutionPolicy -Scope Process RemoteSigned
pip install -r requirements.txt
pytest -q                        # expect: 3 passed

deactivate
cd ..
```

---

## orders-service

Repeat the exact same flow in the other service. It has its own
`requirements.txt` (it additionally needs `requests`), so it needs its **own**
virtualenv.

### macOS / Linux (bash)

```bash
cd orders-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q                        # expect: 4 passed
deactivate
cd ..
```

### Windows (PowerShell)

```powershell
cd orders-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q                        # expect: 4 passed
deactivate
cd ..
```

---

## (Optional) Run a service directly

With a service's venv activated you can run it without Docker:

```bash
# inventory-service, venv active:
python app.py            # serves on http://localhost:8080
# in another shell:
curl -s localhost:8080/stock/widget   # {"sku":"widget","quantity":10}
```

`orders-service` needs `INVENTORY_URL` to point at a running inventory; that's
exactly what Compose does for you in [Step 3](03-compose-local.md), so running
orders standalone is rarely worth it.

---

## Checklist

- [ ] `inventory-service/.venv/` exists and `pytest -q` reports **3 passed**
- [ ] `orders-service/.venv/` exists and `pytest -q` reports **4 passed**
- [ ] Neither `.venv/` directory shows up in `git status` (it's gitignored)

Once both suites are green, continue to
[Step 2 — Containerize each service](02-containerize.md).
