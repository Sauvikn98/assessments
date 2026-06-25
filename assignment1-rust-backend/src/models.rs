use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateCertificateInput {
    pub pem: Option<String>,
    pub subject: Option<String>,
    pub issuer: Option<String>,
    pub expiration: Option<DateTime<Utc>>,
    pub san_entries: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Certificate {
    pub id: Uuid,
    pub subject: String,
    pub issuer: String,
    pub expiration: DateTime<Utc>,
    pub san_entries: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ApiErrorResponse {
    pub error: String,
}
