"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { normalizePhone, formatPhone, formatCurrency } from "@/lib/utils";
import { SendHorizontal } from "lucide-react";

interface QuickPayFormProps {
  onPaymentSent: () => void;
}

export function QuickPayForm({ onPaymentSent }: QuickPayFormProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const normalizedPhone = normalizePhone(phone);
  const isValidPhone = /^254\d{9}$/.test(normalizedPhone);
  const numAmount = parseInt(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount >= 10 && numAmount <= 150000;

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone || !isValidAmount) return;
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    setLoading(true);

    try {
      const res = await fetch("/api/mpesa/b2c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          amount: numAmount,
          commandId: "BusinessPayment",
          remarks: remarks || "Payment",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      toast(`Payment of ${formatCurrency(numAmount)} sent to ${formatPhone(normalizedPhone)}`, "success");
      setPhone("");
      setAmount("");
      setRemarks("");
      onPaymentSent();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Payment failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SendHorizontal className="h-5 w-5 text-emerald-600" />
            <CardTitle>Quick Payment</CardTitle>
          </div>
          <CardDescription>Send money to a customer instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitClick} className="space-y-4">
            <Input
              id="quick-phone"
              label="Phone Number"
              placeholder="0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={phone && !isValidPhone ? "Enter a valid Kenyan phone number" : undefined}
            />
            <Input
              id="quick-amount"
              label="Amount (KES)"
              type="number"
              placeholder="1000"
              min={10}
              max={150000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={amount && !isValidAmount ? "Amount must be between KES 10 and KES 150,000" : undefined}
            />
            <Input
              id="quick-remarks"
              label="Remarks (optional)"
              placeholder="Payment for services"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!isValidPhone || !isValidAmount}
            >
              <SendHorizontal className="h-4 w-4" />
              Send Payment
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogDescription>Please review the payment details below.</DialogDescription>
        <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Recipient</span>
            <span className="text-sm font-medium">{formatPhone(normalizedPhone)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="text-sm font-bold text-emerald-600">{formatCurrency(numAmount || 0)}</span>
          </div>
          {remarks && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Remarks</span>
              <span className="text-sm font-medium">{remarks}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleConfirm}>
            Confirm & Send
          </Button>
        </div>
      </Dialog>
    </>
  );
}
