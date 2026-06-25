use axum_server::tls_rustls::RustlsConfig;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use certificate_service::{create_app, ensure_tls_certificates};

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "certificate_service=debug,tower_http=debug,axum::rejection=trace".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Fetch database URL from environment
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/certsdb".to_string());

    info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to PostgreSQL");

    // Initialize database schema
    certificate_service::db::init_db(&pool)
        .await
        .expect("Failed to initialize database");
    info!("Database initialized.");

    // Build Axum Router
    let app = create_app(pool);

    // Ensure TLS certificates exist, or generate them
    let (cert_path, key_path) = ensure_tls_certificates().await;

    // Configure TLS
    let config = RustlsConfig::from_pem_file(&cert_path, &key_path)
        .await
        .expect("Failed to load TLS certificates");

    let addr = SocketAddr::from(([0, 0, 0, 0], 8443));
    info!("Secure microservice running on {}", addr);

    axum_server::bind_rustls(addr, config)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
