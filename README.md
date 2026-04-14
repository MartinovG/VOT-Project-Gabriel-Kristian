# DevOps Task Manager - Full CI/CD Pipeline

This repository contains a full CI/CD pipeline implementation for a web-based Node.js (Express) application, demonstrating modern DevOps and GitOps practices.

## Project Structure & Features

### 1. Web Application
A REST API built with Express.js and a frontend UI for managing active tasks. The application is containerized using a highly optimized, multi-stage Dockerfile configured to run as a non-root user for enhanced security.

### 2. Pre-commit Hooks (Security & Quality)
We strictly enforce code quality and security at the developer level using **Husky** Git hooks:
- **ESLint**: Scans and blocks bad code structure or unused variables from being committed.
- **Secretlint**: Scans every commit to prevent hardcoded passwords, API tokens, and secrets from accidentally leaking into the repository.

### 3. Continuous Integration (CI) - Jenkins
The automated CI cycle is defined declaratively in the `Jenkinsfile`. Upon execution, the pipeline:
1. Checks out the source code.
2. Installs dependencies securely (`npm ci --ignore-scripts`).
3. Runs the Linters and Secret Scanners to double-check code health.
4. Executes the native Node.js unit tests (`supertest`).
5. Builds a new Docker image tagged with the specific Jenkins `BUILD_NUMBER`.
6. Pushes the Docker image to the public Docker Hub registry.
7. Sends real-time Pipeline Status notifications directly to a Discord server via Webhooks.

### 4. Continuous Deployment (CD) - FluxCD & GitOps
Deployment into the Kubernetes cluster is entirely automated via the GitOps methodology.
- **FluxCD** runs inside the Kubernetes cluster, constantly watching this GitHub repository.
- Changes pushed to the `k8s/` directory (like updating the Deployment or Service) are automatically detected and reconciled inside the cluster without manual `kubectl` intervention.
- **Weave GitOps**: A visual UI dashboard is installed to monitor the continuous deployment health and sync status natively.

---

## Local Development

If you wish to run the API locally without Docker or Kubernetes:

1. Install dependencies:
   ```
   npm install
   ```
2. Start the development server (watches for changes):
   ```
   npm run dev
   ```
3. Run the test suite:
   ```
   npm test
   ```

## Kubernetes Access

To view the GitOps dashboard on a running cluster:
```
kubectl port-forward svc/ww-gitops-weave-gitops -n flux-system 9001:9001
```
Then navigate to `http://localhost:9001` (Credentials: `admin` / `admin`).

To view the **Grafana Monitoring Dashboard** (which includes Prometheus metrics and Loki logs):
```
kubectl port-forward svc/monitoring-kube-prometheus-stack-grafana -n monitoring 3000:80
```
Then navigate to `http://localhost:3000` (Credentials: `admin` / `admin`).

## Infrastructure & Secrets Management

We use HashiCorp **Terraform** to provision the core Kubernetes namespace infrastructure and deploy the **Bitnami Sealed Secrets** controller via Helm. This enables us to safely store encrypted credentials directly in this repository without exposing plaintext secrets.

### How to use Sealed Secrets
To rotate or add a new encrypted secret (like the Discord Webhook):

1. **Install Kubeseal CLI (macOS)**
   ```
   brew install kubeseal
   ```
2. **Fetch the Public Certificate**
   ```
   kubeseal --fetch-cert --controller-name sealed-secrets-controller --controller-namespace sealed-secrets > pub-cert.pem
   ```
3. **Encrypt your Secret**
   ```
   kubectl create secret generic my-secret --namespace monitoring --from-literal=token="super-secret" --dry-run=client -o yaml | kubeseal --cert pub-cert.pem --format yaml > sealed-secret.yaml
   ```
4. **Deploy**
   Commit the resulting `sealed-secret.yaml` to the `k8s/cluster` directory. FluxCD will automatically sync it, and the Sealed Secrets controller will decrypt it safely inside the cluster.
