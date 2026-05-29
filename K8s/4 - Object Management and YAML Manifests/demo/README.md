# K8s Object Management Demo — Imperative → Declarative

A 20–30 minute live classroom demo on **Minikube** showing the evolution of
Kubernetes object management. The app is trivial — `GET /` returns `Version 1`
(or `Version 2`) — so students can *see* updates roll out.

> This demo is **only** about object management. It deliberately ignores
> ConfigMaps, Secrets, Ingress, storage, and networking.

Docker Hub namespace used throughout: **`lironefitoussi`**.

---

## Project Directory Tree

```
demo/
├── README.md                       # this index
├── app/                            # shared application + build/push setup
│   ├── server.js                   # Express app, single GET / endpoint
│   ├── package.json                # one dependency: express
│   ├── Dockerfile                  # small node:20-alpine image
│   ├── .dockerignore
│   └── commands.md                 # ⚙️ build, docker login/push, minikube setup
│
├── phase-1-imperative-cli/
│   └── commands.md                 # kubectl run / expose / get / describe / logs
│
├── phase-2-imperative-files/
│   ├── deployment.yaml             # starts at image 1.0.0, replicas 1
│   ├── service.yaml
│   └── commands.md                 # kubectl create -f / replace -f
│
└── phase-3-declarative/
    ├── deployment.yaml             # starts at image 1.0.0, replicas 1
    ├── service.yaml
    └── commands.md                 # kubectl diff -f / apply -f
```

---

## How to Run the Demo

1. **Setup (once, before class):** follow [app/commands.md](app/commands.md)
   — build both image versions, `docker login`, push to Docker Hub, start Minikube.
2. **Phase 1 — Pure imperative:** [phase-1-imperative-cli/commands.md](phase-1-imperative-cli/commands.md)
3. **Phase 2 — Imperative with files:** [phase-2-imperative-files/commands.md](phase-2-imperative-files/commands.md)
4. **Phase 3 — Declarative:** [phase-3-declarative/commands.md](phase-3-declarative/commands.md)

Each phase folder is self-contained: its own manifests (where applicable),
exact commands, expected outputs, and instructor talking points.

---

## Summary — What Each Command Does

| Command              | Style        | Behavior                                          |
|----------------------|--------------|---------------------------------------------------|
| `kubectl run`        | Imperative   | Create a Pod from CLI args                        |
| `kubectl create`     | Imperative   | Create an object from CLI args                    |
| `kubectl expose`     | Imperative   | Create a Service from CLI args                    |
| `kubectl delete`     | Imperative   | Delete an object                                  |
| `kubectl create -f`  | Imperative   | Create from file; **fails if object exists**      |
| `kubectl replace -f` | Imperative   | Replace the **entire** object with the file       |
| `kubectl apply -f`   | Declarative  | Reconcile live state to the file (**smart merge**)|
| `kubectl diff -f`    | Declarative  | Preview what `apply` would change                 |

**The story arc:** CLI (fast, unrepeatable) → files + create/replace (reviewable,
but blunt) → files + apply (reviewable *and* smart) = the modern standard.

---

## Troubleshooting

- **`ImagePullBackOff`** → the push failed or the local load was skipped. See the
  options in [app/commands.md](app/commands.md). `imagePullPolicy: IfNotPresent`
  means Minikube uses a cached/loaded image when present.
- **`kubectl create -f` says "already exists"** → an object survives from a prior
  phase. Delete it first — itself a great teaching moment about why `create` is
  not idempotent and `apply` is.
- **Browser shows old version** → wait for the rollout (`kubectl get pods -w`),
  then refresh.
