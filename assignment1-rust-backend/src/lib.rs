use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use tracing::{error, info};
use uuid::Uuid;
use std::path::PathBuf;

pub mod db;
pub mod models;
pub mod parser;

use models::{CreateCertificateInput, ApiErrorResponse};

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
}

pub fn create_app(pool: sqlx::PgPool) -> Router {
    // Setup CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/certificates", post(create_certificate).get(list_certificates))
        .route("/certificates/:id", get(get_certificate))
        .layer(cors)
        .with_state(AppState { pool })
}

/// Programmatically generates self-signed certificates if they don't exist
pub async fn ensure_tls_certificates() -> (PathBuf, PathBuf) {
    let cert_dir = PathBuf::from("certs");
    if !cert_dir.exists() {
        std::fs::create_dir_all(&cert_dir).unwrap();
    }

    let cert_path = cert_dir.join("cert.pem");
    let key_path = cert_dir.join("key.pem");

    if !cert_path.exists() || !key_path.exists() {
        info!("TLS certificates not found. Generating self-signed certificates...");
        
        let subject_alt_names = vec!["localhost".to_string(), "127.0.0.1".to_string(), "backend".to_string()];
        let mut params = rcgen::CertificateParams::new(subject_alt_names);
        params.distinguished_name.push(rcgen::DnType::CommonName, "Local Dev Certificate");
        
        let cert = rcgen::Certificate::from_params(params).unwrap();
        let cert_pem = cert.serialize_pem().unwrap();
        let key_pem = cert.serialize_private_key_pem();

        std::fs::write(&cert_path, cert_pem).unwrap();
        std::fs::write(&key_path, key_pem).unwrap();
        info!("TLS certificates generated: certs/cert.pem and certs/key.pem");
    }

    (cert_path, key_path)
}

// Handler to create a certificate
pub async fn create_certificate(
    State(state): State<AppState>,
    Json(payload): Json<CreateCertificateInput>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiErrorResponse>)> {
    let (subject, issuer, expiration, san_entries) = if let Some(pem_str) = payload.pem {
        // Option 1: Parse from raw PEM
        match parser::parse_pem_certificate(&pem_str) {
            Ok(parsed) => (parsed.subject, parsed.issuer, parsed.expiration, parsed.san_entries),
            Err(e) => {
                error!("Certificate parsing failed: {}", e);
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiErrorResponse {
                        error: format!("Failed to parse certificate PEM: {}", e),
                    }),
                ));
            }
        }
    } else {
        // Option 2: Extract from manual metadata fields
        let s = payload.subject.ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ApiErrorResponse {
                    error: "Subject is required when PEM is not provided".to_string(),
                }),
            )
        })?;
        let i = payload.issuer.ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ApiErrorResponse {
                    error: "Issuer is required when PEM is not provided".to_string(),
                }),
            )
        })?;
        let e = payload.expiration.ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ApiErrorResponse {
                    error: "Expiration is required when PEM is not provided".to_string(),
                }),
            )
        })?;
        let sans = payload.san_entries.unwrap_or_default();
        (s, i, e, sans)
    };

    let id = Uuid::new_v4();

    match db::insert_certificate(&state.pool, id, &subject, &issuer, expiration, &san_entries).await {
        Ok(cert) => Ok((StatusCode::CREATED, Json(cert))),
        Err(e) => {
            error!("Database insert failed: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiErrorResponse {
                    error: "Failed to save certificate to database".to_string(),
                }),
            ))
        }
    }
}

// Handler to retrieve a certificate by ID
pub async fn get_certificate(
    State(state): State<AppState>,
    Path(id_str): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiErrorResponse>)> {
    let id = match Uuid::parse_str(&id_str) {
        Ok(uuid) => uuid,
        Err(_) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ApiErrorResponse {
                    error: "Invalid UUID format".to_string(),
                }),
            ));
        }
    };

    match db::get_certificate_by_id(&state.pool, id).await {
        Ok(Some(cert)) => Ok(Json(cert)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiErrorResponse {
                error: "Certificate not found".to_string(),
            }),
        )),
        Err(e) => {
            error!("Database lookup failed: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiErrorResponse {
                    error: "Database error".to_string(),
                }),
            ))
        }
    }
}

// Handler to list all certificates
pub async fn list_certificates(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiErrorResponse>)> {
    match db::list_certificates(&state.pool).await {
        Ok(certs) => Ok(Json(certs)),
        Err(e) => {
            error!("Database query failed: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiErrorResponse {
                    error: "Database error".to_string(),
                }),
            ))
        }
    }
}
