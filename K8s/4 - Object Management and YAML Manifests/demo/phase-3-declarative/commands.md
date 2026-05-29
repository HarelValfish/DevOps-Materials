# Phase 3 — Declarative with Config Files

**Goal:** stop telling Kubernetes *how*. Just declare the **desired state** and
let Kubernetes calculate the diff.

> Files in this folder: `deployment.yaml`, `service.yaml`.
> They start at **image `1.0.0`, `replicas: 1`**.
> Run all commands from this `phase-3-declarative/` directory.

## Create with apply (same file that will later update)

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

kubectl get pods
minikube service version-app --url   # -> "Version 1"
```

## Update the Deployment — EDIT `deployment.yaml`

| Field      | To                  |
|------------|---------------------|
| `replicas` | `4`                 |
| `image`    | `lironefitoussi/version-app:2.0.0` |

## Preview the change BEFORE applying — the killer feature

```bash
kubectl diff -f deployment.yaml
```

## Apply

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w     # Ctrl+C to stop watching
```

Test:

```bash
minikube service version-app --url   # -> "Version 2", now across 4 pods
```

## Teardown

```bash
kubectl delete -f deployment.yaml -f service.yaml
```

---

## ✅ Expected output students should observe
- `kubectl diff` → a red/green unified diff showing **only** `replicas` and `image`
  changing — Kubernetes computed the delta for us.
- `kubectl apply` (update) → `deployment.apps/version-app configured`.
- Pods scale to **4**, all serving **`Version 2`**.

## 🗣️ Instructor talking points
- With `apply` we describe the **desired end state**, not the steps. Kubernetes
  computes what must change via a **3-way merge** (the file, the live object, and
  the last-applied config).
- `apply` is **smart**: it only touches what changed and won't clobber fields
  managed by others (e.g. an HPA owning replica count) the way `replace` does.
- `kubectl diff` lets you **review changes before they happen** — a dry run.
  This is exactly how GitOps tools (Argo CD, Flux) work under the hood.
- The same file **creates** the first time and **updates** every time after —
  `create`/`replace` cannot do that. `apply` is **idempotent**.
- **This is the industry standard.** Real teams keep these YAMLs in Git and let
  CI/CD run `apply`.
