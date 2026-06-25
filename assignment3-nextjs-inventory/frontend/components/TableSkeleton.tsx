import React from "react";

interface TableSkeletonProps {
  rowHeight: number;
  count: number;
}

export default function TableSkeleton({ rowHeight, count }: TableSkeletonProps) {
  return (
    <table className="inventory-table" aria-label="Loading Inventory Data">
      <thead className="table-thead">
        <tr className="table-header-row">
          <th scope="col" className="table-th col-id">ID</th>
          <th scope="col" className="table-th col-name">Name</th>
          <th scope="col" className="table-th col-type">Type</th>
          <th scope="col" className="table-th col-status">Status</th>
          <th scope="col" className="table-th col-date">Last Updated</th>
        </tr>
      </thead>
      <tbody className="table-tbody">
        {Array.from({ length: count }).map((_, i) => (
          <tr key={i} className="table-tr skeleton-row" style={{ height: rowHeight }}>
            <td className="table-td">
              <div className="skeleton-line" style={{ width: "60%" }}></div>
            </td>
            <td className="table-td">
              <div className="skeleton-line" style={{ width: "80%" }}></div>
            </td>
            <td className="table-td">
              <div className="skeleton-line" style={{ width: "50%" }}></div>
            </td>
            <td className="table-td">
              <div className="skeleton-line" style={{ width: "40%" }}></div>
            </td>
            <td className="table-td">
              <div className="skeleton-line" style={{ width: "70%" }}></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
