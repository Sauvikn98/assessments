import React from "react";
import { Certificate } from "../app/inventory/inventory-client";

interface CertificateDetailProps {
  cert: Certificate;
  formatDate: (dateStr: string) => string;
  getExpirationStatus: (dateStr: string) => { label: string; class: string };
}

export default function CertificateDetail({
  cert,
  formatDate,
  getExpirationStatus,
}: CertificateDetailProps) {
  const status = getExpirationStatus(cert.expiration);

  return (
    <div className="detail-card">
      <div className="detail-header">
        <span className={`badge ${status.class}`} style={{ marginBottom: "0.5rem" }}>
          {status.label}
        </span>
        <h2 className="detail-title">{cert.subject}</h2>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <span className="field-label">Subject Common Name (CN)</span>
          <span className="field-value">{cert.subject}</span>
        </div>

        <div className="detail-field">
          <span className="field-label">Issuer Common Name</span>
          <span className="field-value">{cert.issuer}</span>
        </div>

        <div className="detail-field">
          <span className="field-label">Expiration Date</span>
          <span className="field-value">
            {formatDate(cert.expiration)} ({new Date(cert.expiration).toISOString()})
          </span>
        </div>

        <div className="detail-field">
          <span className="field-label">Certificate ID (UUID)</span>
          <span className="field-value mono">{cert.id}</span>
        </div>

        <div className="detail-field">
          <span className="field-label">Subject Alternative Names (SANs)</span>
          {cert.san_entries.length === 0 ? (
            <span className="field-value" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              None
            </span>
          ) : (
            <div className="san-list-tags">
              {cert.san_entries.map((san, index) => (
                <span key={index} className="san-tag">
                  {san}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
