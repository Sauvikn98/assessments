use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt; // for `oneshot`
use serde_json::{json, Value};
use uuid::Uuid;
use chrono::Utc;
use rcgen::{CertificateParams, DnType};

use certificate_service::{create_app, models::Certificate, db};

use tokio::sync::OnceCell;

static DB_INIT: OnceCell<()> = OnceCell::const_new();

/// Connects to the development/test database running on port 5434
async fn get_test_pool() -> sqlx::PgPool {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5434/certsdb".to_string());
    
    let pool = sqlx::PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to test database. Make sure PostgreSQL is running on port 5434.");
    
    // Ensure the database is initialized exactly once across all concurrent test threads
    DB_INIT.get_or_init(|| async {
        certificate_service::db::init_db(&pool)
            .await
            .expect("Failed to initialize test database schema");
    }).await;
    
    pool
}

#[tokio::test]
async fn test_create_certificate_via_pem() {
    let pool = get_test_pool().await;
    let app = create_app(pool);

    // 1. Generate a self-signed certificate using rcgen for testing
    let subject_alt_names = vec!["localhost".to_string(), "127.0.0.1".to_string(), "test-api.local".to_string()];
    let mut params = CertificateParams::new(subject_alt_names);
    params.distinguished_name.push(DnType::CommonName, "Integration Test Service");
    
    let cert = rcgen::Certificate::from_params(params).unwrap();
    let pem_str = cert.serialize_pem().unwrap();

    let payload = json!({
        "pem": pem_str
    });

    // 2. Send POST /certificates
    let req = Request::builder()
        .method("POST")
        .uri("/certificates")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_vec(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // 3. Parse and verify response body
    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let created_cert: Certificate = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(created_cert.subject, "Integration Test Service");
    assert_eq!(created_cert.issuer, "Integration Test Service");
    assert!(created_cert.san_entries.contains(&"localhost".to_string()));
    assert!(created_cert.san_entries.contains(&"test-api.local".to_string()));
    assert!(created_cert.expiration > Utc::now());
}

#[tokio::test]
async fn test_create_certificate_manual() {
    let pool = get_test_pool().await;
    let app = create_app(pool);

    let expiration = Utc::now() + chrono::Duration::days(365);
    let payload = json!({
        "subject": "Manual Subject CN",
        "issuer": "Manual Issuer CN",
        "expiration": expiration,
        "san_entries": ["manual1.local", "manual2.local"]
    });

    // Send POST /certificates
    let req = Request::builder()
        .method("POST")
        .uri("/certificates")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_vec(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let created_cert: Certificate = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(created_cert.subject, "Manual Subject CN");
    assert_eq!(created_cert.issuer, "Manual Issuer CN");
    assert_eq!(created_cert.san_entries, vec!["manual1.local", "manual2.local"]);
    // Compare times ignoring microsecond differences from DB roundtrip
    assert_eq!(created_cert.expiration.timestamp(), expiration.timestamp());
}

#[tokio::test]
async fn test_create_certificate_invalid_pem() {
    let pool = get_test_pool().await;
    let app = create_app(pool);

    let payload = json!({
        "pem": "-----BEGIN CERTIFICATE-----\nInvalidPEMData\n-----END CERTIFICATE-----"
    });

    // Send POST /certificates
    let req = Request::builder()
        .method("POST")
        .uri("/certificates")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_vec(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let err_resp: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(err_resp["error"].as_str().unwrap().contains("Failed to parse certificate PEM"));
}

#[tokio::test]
async fn test_create_certificate_missing_fields() {
    let pool = get_test_pool().await;
    let app = create_app(pool);

    // Missing subject and issuer
    let payload = json!({
        "expiration": Utc::now()
    });

    let req = Request::builder()
        .method("POST")
        .uri("/certificates")
        .header("content-type", "application/json")
        .body(Body::from(serde_json::to_vec(&payload).unwrap()))
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let err_resp: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(err_resp["error"].as_str().unwrap().contains("Subject is required"));
}

#[tokio::test]
async fn test_get_certificate_by_id_flow() {
    let pool = get_test_pool().await;
    let app = create_app(pool.clone());

    // 1. Insert a certificate directly into DB using our db module to get a reliable test state
    let test_id = Uuid::new_v4();
    let subject = "Direct Insert Subject";
    let issuer = "Direct Insert Issuer";
    let expiration = Utc::now() + chrono::Duration::days(30);
    let san_entries = vec!["direct.local".to_string()];

    db::insert_certificate(&pool, test_id, subject, issuer, expiration, &san_entries)
        .await
        .unwrap();

    // 2. Request the certificate via GET /certificates/:id
    let req = Request::builder()
        .method("GET")
        .uri(format!("/certificates/{}", test_id))
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let cert: Certificate = serde_json::from_slice(&body_bytes).unwrap();

    assert_eq!(cert.id, test_id);
    assert_eq!(cert.subject, subject);
    assert_eq!(cert.issuer, issuer);
    assert_eq!(cert.expiration.timestamp(), expiration.timestamp());
    assert_eq!(cert.san_entries, san_entries);
}

#[tokio::test]
async fn test_get_certificate_not_found() {
    let pool = get_test_pool().await;
    let app = create_app(pool);
    let random_id = Uuid::new_v4();

    let req = Request::builder()
        .method("GET")
        .uri(format!("/certificates/{}", random_id))
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let err_resp: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(err_resp["error"].as_str().unwrap(), "Certificate not found");
}

#[tokio::test]
async fn test_get_certificate_invalid_uuid() {
    let pool = get_test_pool().await;
    let app = create_app(pool);

    let req = Request::builder()
        .method("GET")
        .uri("/certificates/not-a-valid-uuid-format")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let err_resp: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(err_resp["error"].as_str().unwrap(), "Invalid UUID format");
}

#[tokio::test]
async fn test_list_certificates() {
    let pool = get_test_pool().await;
    
    // Clear certificates table for consistent listing checks
    sqlx::query("DELETE FROM certificates").execute(&pool).await.unwrap();
    
    let app = create_app(pool.clone());

    // Insert 2 test certificates
    let id1 = Uuid::new_v4();
    let id2 = Uuid::new_v4();
    db::insert_certificate(&pool, id1, "List Subj 1", "List Issuer 1", Utc::now() + chrono::Duration::days(10), &[])
        .await
        .unwrap();
    db::insert_certificate(&pool, id2, "List Subj 2", "List Issuer 2", Utc::now() + chrono::Duration::days(20), &[])
        .await
        .unwrap();

    // Call GET /certificates
    let req = Request::builder()
        .method("GET")
        .uri("/certificates")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    let certs: Vec<Certificate> = serde_json::from_slice(&body_bytes).unwrap();

    assert!(certs.len() >= 2);
    let ids: Vec<Uuid> = certs.iter().map(|c| c.id).collect();
    assert!(ids.contains(&id1));
    assert!(ids.contains(&id2));
}
