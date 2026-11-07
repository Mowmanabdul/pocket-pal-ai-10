import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

    assert.equal(mapping.date, "Value Date");
    assert.equal(mapping.amount, "Amount");
    assert.equal(mapping.category, "");
    assert.deepEqual(transactions.map(({ amount }) => amount), [-54, 12500]);
    assert.equal(transactions[0]?.category, "food");
    assert.ok(transactions[0]?.description.includes("Checkers Hyper"));
  });

  it("keeps income positive even when every imported row is money in", () => {
    const mapping = autoDetectMapping(["Date", "Description", "Amount"]);
    const transactions = rowsToTransactions([
      { Date: "2026-11-06", Description: "Salary", Amount: "12500" },
    ], mapping, true);

    assert.equal(transactions[0]?.amount, 12500);
  });
});