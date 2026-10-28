import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InspectionBadge } from "./inspection-badge";

describe("InspectionBadge", () => {
  it("shows overdue days for expired inspections", () => {
    render(<InspectionBadge dueDate="2026-10-20" today="2026-10-28" />);
    expect(screen.getByText(/期限切れ（8日超過）/)).toBeInTheDocument();
  });

  it("shows remaining days when the deadline is near", () => {
    render(<InspectionBadge dueDate="2026-11-07" today="2026-10-28" />);
    expect(screen.getByText(/30日以内（残り10日）/)).toBeInTheDocument();
  });

  it("omits days when there is plenty of time", () => {
    render(<InspectionBadge dueDate="2027-10-28" today="2026-10-28" />);
    expect(screen.getByText("余裕あり")).toBeInTheDocument();
  });
});
