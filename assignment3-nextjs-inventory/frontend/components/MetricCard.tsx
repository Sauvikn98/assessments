import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  indicatorColor: string;
}

export default function MetricCard({ label, value, indicatorColor }: MetricCardProps) {
  return (
    <div
      className="metric-card"
      style={{ "--indicator-color": indicatorColor } as React.CSSProperties}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
