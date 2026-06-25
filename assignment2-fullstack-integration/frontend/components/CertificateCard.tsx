import React from "react";
import { Certificate } from "../app/inventory/inventory-client";

interface CertificateCardProps {
  cert: Certificate;
  isActive: boolean;
  onClick: () => void;
  formatDate: (dateStr: string) => string;
  getExpirationStatus: (dateStr: string) => { label: string; class: string };
}

export default function CertificateCard({
  cert,
  isActive,
  onClick,
  formatDate,
  getExpirationStatus,
}: CertificateCardProps) {
  const status = getExpirationStatus(cert.expiration);

  return (
    <button
      className={`cert-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{ width: "100%", textAlign: "left" }}
    >
      <div className="cert-info-primary">
        <span className="cert-subject">{cert.subject}</span>
        <span className="cert-issuer">Issued by: {cert.issuer}</span>
      </div>
      <div className="cert-meta-tag" style={{ flexDirection: "column", alignItems: "flex-end" }}>
        <span className={`badge ${status.class}`}>{status.label}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Exp: {formatDate(cert.expiration)}
        </span>
      </div>
    </button>
  );
}
