"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { insertSettlement } from "@/lib/rooms";

type OwedItem = {
  toUserId: string;
  amount: number;
  displayName: string;
};

type Props = {
  roomId: string;
  currentUserId: string;
  owedTo: OwedItem[];
  onClose: () => void;
  onSaved: () => void;
};

export function SettleUpModal({ roomId, currentUserId, owedTo, onClose, onSaved }: Props) {
  const [selectedToUserId, setSelectedToUserId] = useState<string | null>(
    owedTo[0]?.toUserId ?? null
  );
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = owedTo.find((o) => o.toUserId === selectedToUserId);
  const maxAmount = selected?.amount ?? 0;

  useEffect(() => {
    if (owedTo.length > 0) {
      const first = owedTo[0];
      setSelectedToUserId(first.toUserId);
      setAmount(first.amount.toString());
    }
  }, [owedTo]);

  const handleSelectChange = (toUserId: string) => {
    setSelectedToUserId(toUserId);
    const o = owedTo.find((x) => x.toUserId === toUserId);
    setAmount(o?.amount.toString() ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToUserId) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (num > maxAmount) {
      setError(`Amount cannot exceed ${formatCurrency(maxAmount)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await insertSettlement(
      roomId,
      currentUserId,
      selectedToUserId,
      num
    );
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-modal-title"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="flex items-center justify-between">
          <h2 id="settle-modal-title" className="text-lg font-semibold text-gray-900">
            Settle Up
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Record a payment to reduce what you owe. Expenses stay in the budget.
        </p>

        {owedTo.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">You don&apos;t owe anyone.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="settle-to" className="block text-sm font-medium text-gray-700">
                Pay to
              </label>
              <select
                id="settle-to"
                value={selectedToUserId ?? ""}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
              >
                {owedTo.map((o) => (
                  <option key={o.toUserId} value={o.toUserId}>
                    {o.displayName} — {formatCurrency(o.amount)} owed
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="settle-amount" className="block text-sm font-medium text-gray-700">
                Amount paid
              </label>
              <input
                id="settle-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                max={maxAmount}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]"
              />
              {selected && (
                <p className="mt-1 text-xs text-gray-500">
                  Max: {formatCurrency(maxAmount)}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#2E8B57] px-4 py-2 text-sm font-medium text-white hover:bg-[#247a4a] disabled:opacity-70"
              >
                {submitting ? "Saving…" : "Mark as Paid"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
