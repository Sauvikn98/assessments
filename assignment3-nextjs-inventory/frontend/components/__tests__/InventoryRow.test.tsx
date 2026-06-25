import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InventoryRow from "../InventoryRow";
import { InventoryItem } from "../../app/inventory/data-generator";

const mockItem: InventoryItem = {
  id: "INV-000001",
  name: "Apple Laptop Pro 2022 (Gen 1)",
  type: "Laptop",
  status: "In Stock",
  lastUpdated: "2026-06-25T12:00:00Z",
};

describe("InventoryRow Component", () => {
  const mockHandleRowClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders item cells correctly in table row", () => {
    render(
      <table>
        <tbody>
          <InventoryRow
            item={mockItem}
            index={0}
            isFocused={false}
            rowHeight={50}
            handleRowClick={mockHandleRowClick}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText("INV-000001")).toBeInTheDocument();
    expect(screen.getByText("Apple Laptop Pro 2022 (Gen 1)")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  test("applies roving tabIndex and focused class when isFocused is true", () => {
    render(
      <table>
        <tbody>
          <InventoryRow
            item={mockItem}
            index={0}
            isFocused={true}
            rowHeight={50}
            handleRowClick={mockHandleRowClick}
          />
        </tbody>
      </table>
    );

    const rowElement = screen.getByRole("row");
    expect(rowElement).toHaveClass("focused");
    expect(rowElement).toHaveAttribute("tabIndex", "0");
  });

  test("applies tabIndex -1 when isFocused is false", () => {
    render(
      <table>
        <tbody>
          <InventoryRow
            item={mockItem}
            index={0}
            isFocused={false}
            rowHeight={50}
            handleRowClick={mockHandleRowClick}
          />
        </tbody>
      </table>
    );

    const rowElement = screen.getByRole("row");
    expect(rowElement).toHaveAttribute("tabIndex", "-1");
  });

  test("triggers handleRowClick on row click", () => {
    render(
      <table>
        <tbody>
          <InventoryRow
            item={mockItem}
            index={0}
            isFocused={false}
            rowHeight={50}
            handleRowClick={mockHandleRowClick}
          />
        </tbody>
      </table>
    );

    const rowElement = screen.getByRole("row");
    fireEvent.click(rowElement);

    expect(mockHandleRowClick).toHaveBeenCalledWith("INV-000001");
  });
});
