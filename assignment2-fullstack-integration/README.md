# Integrated Certificate Inventory Console

This directory contains a responsive web dashboard built in Next.js that securely integrates with the TLS-secured Rust API from the PKI backend service to manage and monitor SSL/TLS certificates.

---

## Project Structure

- `frontend/app/inventory/page.tsx`: Server Component rendering page layouts and performing initial SSR fetches.
- `frontend/app/inventory/inventory-client.tsx`: Container component managing client SWR states, search filtering, and import modes.
- `frontend/components/`: Directory containing reusable, modular UI components:
  - `StatCard.tsx`: Reusable component displaying individual dashboard statistics.
  - `CertificateCard.tsx`: Reusable component displaying individual certificate cards.
  - `CertificateDetail.tsx`: Reusable component displaying certificate metadata.
  - `PemImportForm.tsx`: Reusable form component handling raw PEM imports.

---

## How to Run

### 1. Pre-requisites
Ensure the secure Rust backend is running. By default, this frontend is configured to connect to the backend at `https://localhost:8445`.

### 2. Run the Next.js Frontend Locally (Development)
To install dependencies and start the development server:
```bash
cd frontend
npm install
export BACKEND_URL=https://localhost:8445
npm run dev
```
Once started, open [http://localhost:3000](http://localhost:3000) in your browser to view the console.

### 3. Run the Next.js Frontend Locally (Production Build)
To test the production build locally:
```bash
cd frontend
npm install
export BACKEND_URL=https://localhost:8445
npm run build
npm start
```

### 4. Run Frontend Unit Tests
To run the component unit tests using Jest and React Testing Library:
```bash
cd frontend
npm run test
```
