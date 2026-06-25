import React, { memo } from "react";
import { InventoryItem } from "../app/inventory/data-generator";

interface InventoryRowProps {
  item: InventoryItem;
  index: number;
  isFocused: boolean;
  rowHeight: number;
  handleRowClick: (id: string) => void;
}

const InventoryRow = memo(({
  item,
  index,
  isFocused,
  rowHeight,
  handleRowClick,
}: InventoryRowProps) => {
  const getBadgeClass = (status: string) => {
    if (status === "In Stock") return "status-badge badge-in-stock";
    if (status === "Out of Stock") return "status-badge badge-out-of-stock";
    return "status-badge badge-low-stock";
  };

  return (
    <tr
      aria-rowindex={index + 2} // Account for 1-based index and header row
      style={{ top: index * rowHeight, height: rowHeight }}
      onClick={() => handleRowClick(item.id)}
      className={`table-tr ${isFocused ? "focused" : ""}`}
      tabIndex={isFocused ? 0 : -1} // Roving tabIndex for grid navigation
    >
      <td className="table-td col-id td-id">{item.id}</td>
      <td className="table-td col-name td-name">{item.name}</td>
      <td className="table-td col-type td-type">{item.type}</td>
      <td className="table-td col-status">
        <span className={getBadgeClass(item.status)}>{item.status}</span>
      </td>
      <td className="table-td col-date td-type">
        {new Date(item.lastUpdated).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
    </tr>
  );
});

InventoryRow.displayName = "InventoryRow";

export default InventoryRow;
