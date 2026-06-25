import React from "react";
import { render, screen } from "@testing-library/react";
import StatCard from "../StatCard";

describe("StatCard Component", () => {
  test("renders label, value, and description correctly", () => {
    render(
      <StatCard
        label="Total Certificates"
        value={15}
        description="Active records in database"
        type="primary"
      />
    );

    expect(screen.getByText("Total Certificates")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Active records in database")).toBeInTheDocument();
  });

  test("applies appropriate type class", () => {
    const { container } = render(
      <StatCard
        label="Total Certificates"
        value={15}
        description="Active records in database"
        type="success"
      />
    );

    const cardElement = container.querySelector(".stat-card");
    expect(cardElement).toHaveClass("success");
  });
});
