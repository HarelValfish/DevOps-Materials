# Phase 1 — Pure Imperative (CLI only)

**Goal:** create everything from the command line. No files at all.

> Prerequisite: images loaded into Minikube (see `../app/commands.md`).

## Create resources from CLI

```bash
# Create a Pod from a command
kubectl run version-app --image=lironefitoussi/version-app:1.0.0 --port=3000

# Expose it with a Service
kubectl expose pod version-app --type=NodePort --port=80 --target-port=3000
```

## Inspect what we made

```bash
kubectl get pods
kubectl get svc
kubectl describe pod version-app
kubectl logs version-app
```

## Test in the browser

```bash
minikube service version-app --url
# open the printed URL -> shows "Version 1"
```

## Clean up before Phase 2

```bash
kubectl delete pod version-app
kubectl delete service version-app
```

---

## ✅ Expected output students should observe
- `kubectl get pods` → one pod `version-app`: `ContainerCreating` → `Running`.
- `kubectl get svc` → a `NodePort` service on a high port (3xxxx).
- `kubectl logs` → `version-app listening on port 3000 (Version 1)`.
- Browser → **`Version 1`**.

## 🗣️ Instructor talking points
- This is the *fastest* way to get something running — great for quick experiments.
- But look at what we have: **nothing reusable**. The definition lives only in
  our shell history.
- **No version control** — a teammate cannot review what we did.
- **Hard to reproduce** — recreating it means remembering every flag exactly.
- `kubectl run` now only creates a bare Pod; for real workloads we want a
  Deployment. That pushes us toward config files → **Phase 2**.
