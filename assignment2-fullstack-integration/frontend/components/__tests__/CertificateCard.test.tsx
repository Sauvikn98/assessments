import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CertificateCard from "../CertificateCard";
import { Certificate } from "../../app/inventory/inventory-client";

const mockCert: Certificate = {
  id: "00000000-0000-0000-0000-000000000000",
  subject: "test.example.com",
  issuer: "Test CA",
  expiration: "2026-12-31T23:59:59Z",
  san_entries: ["test.example.com", "alias.example.com"],
};

describe("CertificateCard Component", () => {
  const mockFormatDate = jest.fn((d) => "Dec 31, 2026");
  const mockGetExpirationStatus = jest.fn((d) => ({ label: "Valid", class: "badge-success" }));
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders certificate details correctly", () => {
    render(
      <CertificateCard
        cert={mockCert}
        isActive={false}
        onClick={mockOnClick}
        formatDate={mockFormatDate}
        getExpirationStatus={mockGetExpirationStatus}
      />
    );

    expect(screen.getByText("test.example.com")).toBeInTheDocument();
    expect(screen.getByText("Issued by: Test CA")).toBeInTheDocument();
    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Exp: Dec 31, 2026")).toBeInTheDocument();
  });

  test("applies active class when isActive is true", () => {
    const { container } = render(
      <CertificateCard
        cert={mockCert}
        isActive={true}
        onClick={mockOnClick}
        formatDate={mockFormatDate}
        getExpirationStatus={mockGetExpirationStatus}
      />
    );

    const buttonElement = container.querySelector("button");
    expect(buttonElement).toHaveClass("active");
  });

  test("triggers onClick callback on click event", () => {
    render(
      <CertificateCard
        cert={mockCert}
        isActive={false}
        onClick={mockOnClick}
        formatDate={mockFormatDate}
        getExpirationStatus={mockGetExpirationStatus}
      />
    );

    const buttonElement = screen.getByRole("button");
    fireEvent.click(buttonElement);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
