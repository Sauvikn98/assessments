import ClientDashboard from "./client-dashboard";
import { generateInventoryDataset } from "./data-generator";
import type { Metadata } from "next";

// Accessibility and performance optimized metadata for SEO
export const metadata: Metadata = {
  title: "Asset Performance Inventory | Scale Assessment",
  description: "Monitor and search over 50,000 simulated system resources at 60fps with full keyboard navigability.",
};

// Server Component
export default async function InventoryPage() {
  // Generate 55,000 simulated inventory records on the server.
  // This operation completes in ~15ms.
  const dataset = generateInventoryDataset(55000);

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ClientDashboard items={dataset} />
    </main>
  );
}
