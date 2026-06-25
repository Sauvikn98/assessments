use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::models::Certificate;

pub async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Ensure the uuid-ossp extension is available and create certificates table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS certificates (
            id UUID PRIMARY KEY,
            subject VARCHAR(255) NOT NULL,
            issuer VARCHAR(255) NOT NULL,
            expiration TIMESTAMPTZ NOT NULL,
            san_entries TEXT[] NOT NULL
        );
        "#
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_certificates_expiration ON certificates (expiration);
        "#
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn insert_certificate(
    pool: &PgPool,
    id: Uuid,
    subject: &str,
    issuer: &str,
    expiration: DateTime<Utc>,
    san_entries: &[String],
) -> Result<Certificate, sqlx::Error> {
    sqlx::query_as::<_, Certificate>(
        r#"
        INSERT INTO certificates (id, subject, issuer, expiration, san_entries)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, subject, issuer, expiration, san_entries
        "#
    )
    .bind(id)
    .bind(subject)
    .bind(issuer)
    .bind(expiration)
    .bind(san_entries)
    .fetch_one(pool)
    .await
}

pub async fn get_certificate_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<Certificate>, sqlx::Error> {
    sqlx::query_as::<_, Certificate>(
        r#"
        SELECT id, subject, issuer, expiration, san_entries
        FROM certificates
        WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn list_certificates(
    pool: &PgPool,
) -> Result<Vec<Certificate>, sqlx::Error> {
    sqlx::query_as::<_, Certificate>(
        r#"
        SELECT id, subject, issuer, expiration, san_entries
        FROM certificates
        ORDER BY expiration ASC
        "#
    )
    .fetch_all(pool)
    .await
}
