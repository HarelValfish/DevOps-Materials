# Phase 2 — Imperative with Config Files

**Goal:** the same result as Phase 1, but the definition now lives in files we
can review, audit, and commit.

> Files in this folder: `deployment.yaml`, `service.yaml`.
> They start at **image `1.0.0`, `replicas: 1`**.
> Run all commands from this `phase-2-imperative-files/` directory.

## Create from files

```bash
kubectl create -f deployment.yaml
kubectl create -f service.yaml

kubectl get deployments
kubectl get pods
kubectl get svc
```

Test:

```bash
minikube service version-app --url   # -> "Version 1"
```

## Update the Deployment — EDIT `deployment.yaml`

Change these two lines:

| Field      | From                 | To                   |
|------------|----------------------|----------------------|
| `replicas` | `1`                  | `3`                  |
| `image`    | `lironefitoussi/version-app:1.0.0`  | `lironefitoussi/version-app:2.0.0`  |

Apply the update the **imperative** way:

```bash
kubectl replace -f deployment.yaml
```

Watch the rollout, then test:

```bash
kubectl get pods -w     # Ctrl+C to stop watching
minikube service version-app --url   # -> "Version 2"
```

## Clean up before Phase 3

```bash
kubectl delete -f deployment.yaml -f service.yaml
```

---

## ✅ Expected output students should observe
- After `create -f`: 1 pod, browser shows **`Version 1`**.
- After editing + `replace -f`: pods scale to **3**, new pods run image `2.0.0`,
  browser shows **`Version 2`**.

## 🗣️ Instructor talking points
- The object definition now lives in a **file** — reviewable, auditable, and
  committable to Git. A big step up from Phase 1.
- `kubectl replace -f` **replaces the entire object** with the file's contents.
  The file is the *whole truth*; anything not in the file is dropped.
- So the file **must contain the full, current object**. (Bonus demo: try
  `replace -f` with a field removed and show it disappear.)
- It's still imperative because **we** name the verb: "replace this."
- `kubectl create -f` is **not idempotent** — run it twice and it errors with
  "already exists." That limitation is exactly what `apply` fixes in Phase 3.
