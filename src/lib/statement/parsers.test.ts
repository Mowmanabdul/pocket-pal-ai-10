import { describe, expect, it } from "bun:test";
import { autoDetectMapping, rowsToTransactions } from "./parsers";

describe("bank statement tabular imports", () => {
  it("maps Amount rather than Value Date and preserves negative expenses and positive income", () => {
    const headers = ["Value Date", "Value Time", "Type", "Description", "Beneficiary or CardHolder", "Amount"];
    const mapping = autoDetectMapping(headers);
    const transactions = rowsToTransactions([
      {
        "Value Date": "06/11/2026",
        "Value Time": "12:30",
        Type: "Card purchase",
        Description: "POS PURCHASE",
        "Beneficiary or CardHolder": "Checkers Hyper",
        Amount: "-54.00",
      },
      {
        "Value Date": "06/11/2026",
        "Value Time": "13:00",
        Type: "EFT credit",
        Description: "SALARY PAYMENT",
        "Beneficiary or CardHolder": "Acme Ltd",
        Amount: "12500.00",
      },
    ], mapping, true);

    expect(mapping.date).toBe("Value Date");
    expect(mapping.amount).toBe("Amount");
    expect(mapping.category).toBe("");
    expect(transactions.map(({ amount }) => amount)).toEqual([-54, 12500]);
    expect(transactions[0]?.category).toBe("food");
    expect(transactions[0]?.description).toContain("Checkers Hyper");
  });

  it("keeps income positive even when every imported row is money in", () => {
    const mapping = autoDetectMapping(["Date", "Description", "Amount"]);
    const transactions = rowsToTransactions([
      { Date: "2026-11-06", Description: "Salary", Amount: "12500" },
    ], mapping, true);

    expect(transactions[0]?.amount).toBe(12500);
  });
});