## Workspace Structure

The platform is organized into three isolated, self-contained project directories:

```
multi-service-platform/
├── README.md                          # Global workspace overview
├── start_all.sh                       # Local orchestrator script
├── assignment1-rust-backend/          # Secure Rust PKI Backend (Dockerized)
├── assignment2-fullstack-integration/ # Integrated Next.js PKI Management Console (Local)
└── assignment3-nextjs-inventory/      # High-Performance Virtualized Dashboard (Local)
```

## Running the Entire Ecosystem Simultaneously

A helper script `start_all.sh` is provided in the root directory. It spins up the containerized Rust backend and PostgreSQL database, and launches both Next.js frontends locally in the background.

To run it:
```bash
chmod +x start_all.sh
./start_all.sh
```

## Run the Service

### 1. Secure Rust PKI Backend (`assignment1-rust-backend`)
An asynchronous Rust API (Axum) featuring a custom X.509 PEM certificate parser, native TLS (with automatic self-signed certificate generation on startup), and database persistence via SQLx and PostgreSQL.
- **Features**: Custom parser, zero-config native TLS, non-root hardened Docker container, in-memory integration testing.
- **Directory**: `./assignment1-rust-backend/`
- **Run (Dockerized)**:
  ```bash
  docker-compose up --build
  ```
- **Test**:
  ```bash
  cargo test
  ```

### 2. Integrated Next.js PKI Management Console (`assignment2-fullstack-integration`)
A Next.js App Router frontend integrated with the secure TLS Rust API, featuring hybrid Server-Side Rendering (SSR) for the initial load and client-side SWR caching, real-time metrics updates, and a PEM upload console.
- **Features**: Derived real-time metrics, optimistic SWR mutations, server-side API proxying (bypassing local TLS trust issues), CSS Modules, and Jest unit tests.
- **Directory**: `./assignment2-fullstack-integration/`
- **Run (Local Development)**:
  ```bash
  cd frontend
  npm install
  export BACKEND_URL=https://localhost:8445
  npm run dev
  ```
- **Run (Local Production Build)**:
  ```bash
  cd frontend
  npm install
  export BACKEND_URL=https://localhost:8445
  npm run build
  npm start
  ```
- **Test**:
  ```bash
  cd frontend
  npm run test
  ```

### 3. High-Performance Virtualized Inventory Dashboard (`assignment3-nextjs-inventory`)
A high-performance Next.js dashboard simulating 55,000+ records in a custom-built, fully virtualized table with dynamic sorting, fuzzy filtering, and comprehensive WAI-ARIA keyboard and screen reader accessibility.
- **Features**: 60 FPS scrolling, custom virtualizer, debounced search, pre-parsed numeric sort optimization, roving tabIndex keyboard navigation, aria-live status announcements, and Jest unit tests.
- **Directory**: `./assignment3-nextjs-inventory/`
- **Run (Local Development)**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Run (Local Production Build)**:
  ```bash
  cd frontend
  npm install
  npm run build
  npm start
  ```
- **Test**:
  ```bash
  cd frontend
  npm run test
  ```

---

- **Rust PKI Backend (API)**: Exposed on [https://localhost:8445](https://localhost:8445)
- **PKI Management Console (UI)**: Runs on [http://localhost:3000](http://localhost:3000)
- **Virtualized Inventory Dashboard (UI)**: Runs on [http://localhost:3001](http://localhost:3001)
- **Logs**: Local logs for the frontends are written to `assignment2-fullstack-integration/assignment2.log` and `assignment3-nextjs-inventory/assignment3.log` respectively.
