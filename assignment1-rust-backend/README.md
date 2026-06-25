# Secure X.509 Certificate Management Microservice

This directory contains a secure, containerized, asynchronous Rust API that parses X.509 certificates and manages their metadata in a PostgreSQL database.

---

## Project Structure

- `src/main.rs`: Thin binary entrypoint that connects to the database, initializes the schema, and starts the Axum server.
- `src/lib.rs`: Library target housing CORS configurations, routing, and HTTP handler implementations.
- `src/parser.rs`: Pure-Rust certificate parser using `x509-parser` to extract metadata and SAN extensions.
- `src/db.rs`: SQLx PostgreSQL database operations and schema initializations.
- `src/models.rs`: Data transfer objects (DTOs) and database entities.
- `tests/api_tests.rs`: Comprehensive in-memory integration test suite for the Axum router and handlers.
- `Dockerfile`: Hardened multi-stage build running the binary under a dedicated non-root user.
- `docker-compose.yml`: Database and API services orchestration.

---

## How to Run & Test

### 1. Run the Microservice
To build and start the PostgreSQL database and the secure Rust API container together:
```bash
docker-compose up --build
```
*Note: The server will automatically generate self-signed TLS certificates in the `certs/` folder on startup and listen securely on `https://localhost:8445` (mapped from port `8443` inside the container).*

### 2. Run the Test Suite
To run the parser validation and the Axum API integration tests:
```bash
cargo test
```

---

## API Usage Examples

#### Import a Certificate (via PEM parsing)
```bash
curl -k -X POST https://localhost:8445/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "pem": "-----BEGIN CERTIFICATE-----\nMIIFdzCCBF+gAwIBAgIQA...\n-----END CERTIFICATE-----"
  }'
```

#### Retrieve a Certificate by ID
```bash
curl -k -X GET https://localhost:8445/certificates/<uuid-id>
```
*(Note: The `-k` or `--insecure` flag is used to allow curl to trust the self-signed TLS certificate in development).*
