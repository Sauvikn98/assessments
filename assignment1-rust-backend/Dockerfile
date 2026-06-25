# --- Build Stage ---
FROM rust:slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy dependency manifests and build dummy source to cache dependencies
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/certificate_service*

# Copy actual source code
COPY src ./src

# Build the release binary
RUN cargo build --release

# --- Runtime Stage ---
FROM debian:bookworm-slim AS runner

# Install runtime dependencies (OpenSSL/CA certificates for outbound SSL/TLS if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -s /sbin/nologin appuser

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /usr/src/app/target/release/certificate-service /app/certificate-service

# Create certs directory and set ownership so the non-root user can generate TLS certificates
RUN mkdir /app/certs && chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the native TLS port
EXPOSE 8443

# Set runtime environment variables
ENV DATABASE_URL=postgres://postgres:postgres@db:5432/certsdb
ENV RUST_LOG=info

# Run the binary
CMD ["/app/certificate-service"]
