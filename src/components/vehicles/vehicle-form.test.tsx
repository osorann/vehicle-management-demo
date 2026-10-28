import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { emptyVehicleForm } from "@/lib/validation";
import { VehicleForm } from "./vehicle-form";

describe("VehicleForm", () => {
  it("shows validation errors and does not submit invalid input", async () => {
    const onSubmit = vi.fn();
    render(<VehicleForm initialValues={emptyVehicleForm()} submitLabel="登録する" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("登録番号を入力してください")).toBeInTheDocument();
    expect(screen.getByText("車検満了日を入力してください")).toBeInTheDocument();
    expect(screen.getByLabelText(/登録番号/)).toHaveAttribute("aria-invalid", "true");
  });

  it("submits parsed values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VehicleForm initialValues={emptyVehicleForm()} submitLabel="登録する" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/登録番号/), "デモ 300 あ 12-34");
    await userEvent.type(screen.getByLabelText(/車名・管理名/), "テスト車");
    await userEvent.clear(screen.getByLabelText(/走行距離/));
    await userEvent.type(screen.getByLabelText(/走行距離/), "1,200");
    await userEvent.type(screen.getByLabelText(/車検満了日/), "2027-04-01");
    await userEvent.selectOptions(screen.getByLabelText(/車種/), "truck");
    await userEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        plateNumber: "デモ 300 あ 12-34",
        name: "テスト車",
        mileage: 1200,
        vehicleType: "truck",
        inspectionDueDate: "2027-04-01",
      }),
    );
  });

  it("displays errors thrown while saving", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("車両の登録に失敗しました"));
    render(
      <VehicleForm
        initialValues={{ ...emptyVehicleForm(), plateNumber: "A", name: "B", inspectionDueDate: "2027-01-01" }}
        submitLabel="登録する"
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(await screen.findByText("車両の登録に失敗しました")).toBeInTheDocument();
  });
});
