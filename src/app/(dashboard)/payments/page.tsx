"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { normalizePhone, formatPhone, formatCurrency } from "@/lib/utils";
import { SendHorizontal, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

const commandOptions = [
  { value: "BusinessPayment", label: "Business Payment" },
  { value: "SalaryPayment", label: "Salary Payment" },
  { value: "PromotionPayment", label: "Promotion Payment" },
];

type PaymentResult = {
  transactionId: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "TIMED_OUT";
  message: string;
} | null;

export default function PaymentsPage() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [commandId, setCommandId] = useState("BusinessPayment");
  const [remarks, setRemarks] = useState("");
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<PaymentResult>(null);
  const [polling, setPolling] = useState(false);

  const normalizedPhone = normalizePhone(phone);
  const isValidPhone = /^254\d{9}$/.test(normalizedPhone);
  const numAmount = parseInt(amount);
  const isValidAmount = !isNaN(numAmount) && numAmount >= 10 && numAmount <= 150000;

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone || !isValidAmount) return;
    setConfirmOpen(true);
  }

  async function pollStatus(transactionId: string) {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds max

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/transactions?search=${transactionId}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const txn = data.transactions?.[0];
          if (txn && txn.status !== "PENDING") {
            setResult({
              transactionId: txn.id,
              status: txn.status,
              message: txn.status === "SUCCESS"
                ? `Payment of ${formatCurrency(txn.amount)} sent successfully to ${formatPhone(txn.partyB)}`
                : `Payment failed: ${txn.status}`,
            });
            setPolling(false);
            clearInterval(interval);
          }
        }
      } catch {
        // continue polling
      }

      if (attempts >= maxAttempts) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 3000);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/mpesa/b2c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          amount: numAmount,
          commandId,
          remarks: remarks || "Payment",
          occasion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setResult({
        transactionId: data.transactionId,
        status: "PENDING",
        message: "Payment initiated. Waiting for M-Pesa confirmation...",
      });

      toast("Payment sent to M-Pesa for processing", "success");

      // Start polling for status update
      pollStatus(data.transactionId);

      // Reset form
      setPhone("");
      setAmount("");
      setRemarks("");
      setOccasion("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Payment failed", "error");
      setResult({
        transactionId: "",
        status: "FAILED",
        message: error instanceof Error ? error.message : "Payment failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Payment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Send B2C payment to a customer from your paybill
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Fill in the recipient details and amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitClick} className="space-y-4">
              <Input
                id="phone"
                label="Phone Number"
                placeholder="0712345678 or 254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={phone && !isValidPhone ? "Enter a valid Kenyan phone number" : undefined}
              />
              <Input
                id="amount"
                label="Amount (KES)"
                type="number"
                placeholder="1000"
                min={10}
                max={150000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={amount && !isValidAmount ? "Amount must be between KES 10 and KES 150,000" : undefined}
              />
              <Select
                id="commandId"
                label="Payment Type"
                options={commandOptions}
                value={commandId}
                onChange={(e) => setCommandId(e.target.value)}
              />
              <Input
                id="remarks"
                label="Remarks"
                placeholder="Payment for services"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <Input
                id="occasion"
                label="Occasion (optional)"
                placeholder="Invoice #123"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
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

        {/* Payment Status */}
        <div className="space-y-6">
          {result && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {result.status === "PENDING" && (
                    <Clock className="h-12 w-12 text-yellow-500 mx-auto animate-pulse" />
                  )}
                  {result.status === "SUCCESS" && (
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                  )}
                  {(result.status === "FAILED" || result.status === "TIMED_OUT") && (
                    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                  )}

                  <div>
                    <Badge
                      variant={
                        result.status === "SUCCESS" ? "success" :
                        result.status === "PENDING" ? "warning" : "error"
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600">{result.message}</p>

                  {polling && (
                    <p className="text-xs text-gray-400 animate-pulse">
                      Checking payment status...
                    </p>
                  )}

                  {result.transactionId && (
                    <Link
                      href={`/payments/${result.transactionId}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View Transaction Details
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-3">Payment Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Minimum amount: KES 10</li>
                <li>Maximum amount: KES 150,000</li>
                <li>Phone numbers: Kenyan numbers (07XX or 254XX format)</li>
                <li>Business Payment: Standard B2C payment</li>
                <li>Salary Payment: Salary disbursement</li>
                <li>Promotion Payment: Promotional payment</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogDescription>
          Please review the details below before sending.
        </DialogDescription>
        <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Recipient</span>
            <span className="text-sm font-medium">{formatPhone(normalizedPhone)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="text-sm font-bold text-emerald-600">
              {formatCurrency(numAmount || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Type</span>
            <span className="text-sm font-medium">
              {commandOptions.find((o) => o.value === commandId)?.label}
            </span>
          </div>
          {remarks && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Remarks</span>
              <span className="text-sm font-medium">{remarks}</span>
            </div>
          )}
          {occasion && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Occasion</span>
              <span className="text-sm font-medium">{occasion}</span>
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
    </div>
  );
}
