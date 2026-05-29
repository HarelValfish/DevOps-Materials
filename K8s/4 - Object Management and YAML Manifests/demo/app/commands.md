# App Build, Push & Minikube Setup — Commands

Do this **once before class**. Builds both image versions, pushes them to
Docker Hub, and makes them available to Minikube.

Run all commands from this `app/` directory.

> Docker Hub namespace used throughout this demo: **`lironefitoussi`**
> (Docker Hub repos are always lowercase). Replace it if you use a different account.

## Log in to Docker Hub

```bash
docker login
# enter your Docker Hub username + password / access token
```

## Start Minikube

```bash
minikube start
```

## Build Version 1 image (1.0.0)

`server.js` already says `"Version 1"`.

```bash
docker build -t lironefitoussi/version-app:1.0.0 .
```

## Build Version 2 image (2.0.0)

Edit `server.js`: change `const VERSION = "Version 1";` to `"Version 2";`, then:

```bash
docker build -t lironefitoussi/version-app:2.0.0 .
```

Then change it **back to `"Version 1"`** to keep the source clean. The 2.0.0 image
is already built, so the source no longer matters.

## Push both images to Docker Hub

```bash
docker push lironefitoussi/version-app:1.0.0
docker push lironefitoussi/version-app:2.0.0
```

Confirm they exist at: https://hub.docker.com/r/lironefitoussi/version-app/tags

---

## Make the images available to Minikube — pick ONE

### Option A — pull from Docker Hub (default)
Nothing extra to do. The manifests reference `lironefitoussi/version-app:<tag>`,
and Minikube will pull from Docker Hub on first use.

> Because the tags exist remotely, `imagePullPolicy: IfNotPresent` means Minikube
> only pulls once, then reuses the cached image.

### Option B — load locally (faster, works offline, no pull)

```bash
minikube image load lironefitoussi/version-app:1.0.0
minikube image load lironefitoussi/version-app:2.0.0
```

Verify:

```bash
minikube image ls | grep version-app
```

> 💡 PowerShell: replace `grep version-app` with `Select-String version-app`.

---

> ⚠️ The manifests use `imagePullPolicy: IfNotPresent`. If you see
> `ImagePullBackOff`, either the push failed (Option A) or the load was skipped
> (Option B) — re-run the relevant step above.
