import React from "react";

interface PemImportFormProps {
  pemInput: string;
  setPemInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  formError: string | null;
}

export default function PemImportForm({
  pemInput,
  setPemInput,
  onSubmit,
  onCancel,
  isSubmitting,
  formError,
}: PemImportFormProps) {
  return (
    <form onSubmit={onSubmit} className="detail-card">
      <div className="detail-header">
        <h2 className="detail-title">Import X.509 Certificate</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Paste a PEM-encoded certificate. Our Rust microservice will parse it and extract the metadata automatically.
        </p>
      </div>

      <div className="form-group">
        <label className="field-label" htmlFor="pem-input">
          PEM Certificate Content
        </label>
        <textarea
          id="pem-input"
          rows={10}
          placeholder="-----BEGIN CERTIFICATE-----\nMIIFdzCCBF+gAwIBAgIQA...\n-----END CERTIFICATE-----"
          value={pemInput}
          onChange={(e) => setPemInput(e.target.value)}
          required
        />
      </div>

      {formError && (
        <div
          style={{
            color: "var(--error)",
            fontSize: "0.85rem",
            padding: "0.5rem",
            background: "var(--error-glow)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {formError}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Parsing..." : "Parse & Import"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
