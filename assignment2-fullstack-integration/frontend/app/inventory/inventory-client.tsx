"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import StatCard from "../../components/StatCard";
import CertificateCard from "../../components/CertificateCard";
import CertificateDetail from "../../components/CertificateDetail";
import PemImportForm from "../../components/PemImportForm";

export interface Certificate {
  id: string;
  subject: string;
  issuer: string;
  expiration: string;
  san_entries: string[];
}

interface InventoryClientProps {
  initialCertificates: Certificate[];
  backendUrl: string; // The URL for client-side API requests
}

// Fetcher for SWR. Note that the browser needs to trust the self-signed cert by visiting https://localhost:8443/certificates once.
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch certificates");
  }
  return res.json();
};

export default function InventoryClient({ initialCertificates, backendUrl }: InventoryClientProps) {
  // Client-side state using SWR for caching & revalidation
  const { data: certificates, error, mutate } = useSWR<Certificate[]>(
    `${backendUrl}/certificates`,
    fetcher,
    {
      fallbackData: initialCertificates,
      refreshInterval: 5000, // Revalidate every 5 seconds
    }
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    certificates && certificates.length > 0 ? certificates[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [pemInput, setPemInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter certificates based on search term
  const filteredCertificates = useMemo(() => {
    if (!certificates) return [];
    return certificates.filter(
      (cert) =>
        cert.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.san_entries.some((san) => san.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [certificates, searchTerm]);

  // Find currently selected certificate
  const selectedCertificate = useMemo(() => {
    if (!certificates || !selectedId) return null;
    return certificates.find((c) => c.id === selectedId) || null;
  }, [certificates, selectedId]);

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    if (!certificates) return { total: 0, expiringSoon: 0 };
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let expiringSoon = 0;
    certificates.forEach((cert) => {
      const expDate = new Date(cert.expiration);
      if (expDate > now && expDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }
    });

    return {
      total: certificates.length,
      expiringSoon,
    };
  }, [certificates]);

  // Handle manual PEM upload/creation
  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pemInput.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${backendUrl}/certificates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pem: pemInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse and save certificate");
      }

      // Clear form, close modal/form view
      setPemInput("");
      setShowAddForm(false);
      
      // Update local SWR cache immediately
      mutate();
      
      // Select the newly created certificate
      if (data.id) {
        setSelectedId(data.id);
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format date cleanly in a locale-independent and timezone-independent way
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Helper to determine expiration status
  const getExpirationStatus = (dateStr: string) => {
    const now = new Date();
    const expDate = new Date(dateStr);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (expDate <= now) {
      return { label: "Expired", class: "badge-error" };
    } else if (expDate.getTime() - now.getTime() <= thirtyDays) {
      return { label: "Expiring Soon", class: "badge-warning" };
    } else {
      return { label: "Valid", class: "badge-success" };
    }
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>Certificate Inventory</h1>
          <p className="subtitle">Secure certificate catalog and analytics dashboard</p>
        </div>
        <button 
          className="btn" 
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) setSelectedId(null);
          }}
        >
          {showAddForm ? "View Details" : "+ Import PEM Certificate"}
        </button>
      </header>

      {/* Dashboard Analytics Section using Reusable StatCards */}
      <section className="dashboard-grid">
        <StatCard
          label="Total Certificates"
          value={metrics.total}
          description="Active certificate records in database"
          type="primary"
        />
        <StatCard
          label="Expiring Soon (30 Days)"
          value={metrics.expiringSoon}
          description="Certificates requiring immediate renewal"
          type="warning"
        />
        <StatCard
          label="API Gateway Status"
          value="SECURE"
          description="TLS HTTPS / Axum Microservice"
          type="success"
          style={{ fontSize: "1.8rem" }}
        />
      </section>

      {/* Main Content Area */}
      <div className="content-layout">
        
        {/* Left Column: Inventory List */}
        <div className="section-card">
          <div className="section-title">
            <span>Certificates List ({filteredCertificates.length})</span>
            <input
              type="text"
              placeholder="Search by subject, issuer, SAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "240px", padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            />
          </div>

          {error && (
            <div style={{ color: "var(--error)", marginBottom: "1rem", fontSize: "0.9rem" }}>
              ⚠️ Connection failed: Please verify the backend is running and you have accepted the self-signed certificate.
            </div>
          )}

          <div className="cert-list">
            {filteredCertificates.length === 0 ? (
              <div className="empty-placeholder" style={{ minHeight: "200px" }}>
                <span className="empty-icon">🔍</span>
                <span>No certificates found matching your search.</span>
              </div>
            ) : (
              filteredCertificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  isActive={selectedId === cert.id}
                  onClick={() => {
                    setSelectedId(cert.id);
                    setShowAddForm(false);
                  }}
                  formatDate={formatDate}
                  getExpirationStatus={getExpirationStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Details View OR Upload Form using Reusable Components */}
        <div className="section-card">
          {showAddForm ? (
            <PemImportForm
              pemInput={pemInput}
              setPemInput={setPemInput}
              onSubmit={handleAddCertificate}
              onCancel={() => setShowAddForm(false)}
              isSubmitting={isSubmitting}
              formError={formError}
            />
          ) : selectedCertificate ? (
            <CertificateDetail
              cert={selectedCertificate}
              formatDate={formatDate}
              getExpirationStatus={getExpirationStatus}
            />
          ) : (
            <div className="empty-placeholder">
              <span className="empty-icon">📜</span>
              <span>Select a certificate from the list to view its detailed parameters or import a new one.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
