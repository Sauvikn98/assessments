import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  type?: "primary" | "warning" | "success";
  style?: React.CSSProperties;
}

export default function StatCard({ label, value, description, type, style }: StatCardProps) {
  const cardClass = `stat-card ${type || ""}`;
  return (
    <div className={cardClass} style={style}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-desc">{description}</span>
    </div>
  );
}
