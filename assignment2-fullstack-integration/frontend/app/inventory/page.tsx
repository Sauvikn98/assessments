import InventoryClient, { Certificate } from "./inventory-client";
import type { Metadata } from "next";

// SEO metadata
export const metadata: Metadata = {
  title: "Certificate Inventory | Secure Management",
  description: "Monitor and manage SSL/TLS certificate expirations and details securely over TLS.",
};

export default async function InventoryPage() {
  const serverBackendUrl = process.env.BACKEND_URL || "https://localhost:8443";
  const clientBackendUrl = "/api";

  // Disable TLS rejection for local self-signed certificates in development
  if (process.env.NODE_ENV === "development" || serverBackendUrl.includes("localhost") || serverBackendUrl.includes("backend")) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let initialCertificates: Certificate[] = [];
  let fetchError = false;

  try {
    const res = await fetch(`${serverBackendUrl}/certificates`, {
      cache: "no-store",
      headers: {
        "Accept": "application/json",
      },
    });

    if (res.ok) {
      initialCertificates = await res.json();
    } else {
      console.error(`Backend returned status ${res.status} on SSR fetch`);
      fetchError = true;
    }
  } catch (error) {
    console.error("Failed to perform Server-Side Rendering fetch from Rust API:", error);
    fetchError = true;
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {fetchError && (
        <div style={{
          background: "var(--warning-glow)",
          color: "var(--warning)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
          padding: "0.75rem 1.5rem",
          fontSize: "0.85rem",
          textAlign: "center",
        }}>
          ⚠️ Server-side connection to the Rust API at <code>{serverBackendUrl}</code> failed. Using fallback client-side connection.
        </div>
      )}
      <InventoryClient 
        initialCertificates={initialCertificates} 
        backendUrl={clientBackendUrl} 
      />
    </main>
  );
}
