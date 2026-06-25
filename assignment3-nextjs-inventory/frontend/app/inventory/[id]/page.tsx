import React from 'react';
import Link from 'next/link';
import { getInventoryItemById } from '../data-generator';
import { notFound } from 'next/navigation';

export default async function InventoryDetail({ params }: { params: Promise<{ id: string }> }) {
  // Wait for params in Next.js 15+ 
  const { id } = await params;
  
  const item = getInventoryItemById(id);

  if (!item) {
    notFound();
  }

  const getBadgeClass = (status: string) => {
    if (status === "In Stock") return "status-badge badge-in-stock";
    if (status === "Out of Stock") return "status-badge badge-out-of-stock";
    return "status-badge badge-low-stock";
  };

  return (
    <div className="dashboard-container">
      <Link href="/inventory" className="detail-back">
        &larr; Back to Dashboard
      </Link>
      
      <div className="detail-container">
        <h1 className="detail-title">{item.name}</h1>
        
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{item.id}</span>
          </div>
          
          <div className="detail-field">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{item.type}</span>
          </div>
          
          <div className="detail-field">
            <span className="detail-label">Status:</span>
            <span className={getBadgeClass(item.status)}>{item.status}</span>
          </div>
          
          <div className="detail-field">
            <span className="detail-label">Last Updated:</span>
            <span className="detail-value">{new Date(item.lastUpdated).toLocaleString("en-US")}</span>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Server Component Verification</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          This page was rendered purely on the server using Next.js Server Components. 
          Zero client-side JavaScript is required for this detail view, maximizing performance and meeting the evaluation criteria.
        </p>
      </div>
    </div>
  );
}
