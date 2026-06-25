import React from "react";
import { render, screen } from "@testing-library/react";
import MetricCard from "../MetricCard";

describe("MetricCard Component", () => {
  test("renders label and value correctly", () => {
    render(<MetricCard label="In Stock" value="1,200" indicatorColor="var(--success)" />);

    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
  });
});
