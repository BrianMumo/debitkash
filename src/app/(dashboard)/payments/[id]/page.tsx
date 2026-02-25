"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPhone, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "error",
  TIMED_OUT: "error",
};

interface TransactionDetail {
  id: string;
  createdAt: string;
  commandId: string;
  amount: string;
  partyA: string;
  partyB: string;
  remarks: string | null;
  occasion: string | null;
  conversationId: string | null;
  originatorConversationId: string | null;
  mpesaTransactionId: string | null;
  status: string;
  resultCode: number | null;
  resultDesc: string | null;
  recipientName: string | null;
  isRegisteredCustomer: boolean | null;
  completedAt: string | null;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const res = await fetch(`/api/transactions?search=${params.id}&limit=100`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const txn = data.transactions?.find((t: TransactionDetail) => t.id === params.id);
        if (txn) {
          setTransaction(txn);
        } else {
          setError("Transaction not found");
        }
      } catch {
        setError("Failed to load transaction");
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();

    // Poll if pending
    const interval = setInterval(async () => {
      if (transaction?.status === "PENDING") {
        try {
          const res = await fetch(`/api/transactions?search=${params.id}&limit=100`);
          if (res.ok) {
            const data = await res.json();
            const txn = data.transactions?.find((t: TransactionDetail) => t.id === params.id);
            if (txn) setTransaction(txn);
          }
        } catch {
          // ignore polling errors
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [params.id, transaction?.status]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || "Transaction not found"}</p>
        <Link href="/transactions">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  const details = [
    { label: "Transaction ID", value: transaction.id },
    { label: "M-Pesa Receipt", value: transaction.mpesaTransactionId || "Pending" },
    { label: "Recipient", value: transaction.recipientName || formatPhone(transaction.partyB) },
    { label: "Phone Number", value: formatPhone(transaction.partyB) },
    { label: "Amount", value: formatCurrency(transaction.amount) },
    { label: "Payment Type", value: transaction.commandId },
    { label: "Remarks", value: transaction.remarks || "-" },
    { label: "Occasion", value: transaction.occasion || "-" },
    { label: "Initiated", value: formatDate(transaction.createdAt) },
    { label: "Completed", value: transaction.completedAt ? formatDate(transaction.completedAt) : "Pending" },
    { label: "Result Code", value: transaction.resultCode?.toString() ?? "Pending" },
    { label: "Result Description", value: transaction.resultDesc || "Pending" },
    { label: "Conversation ID", value: transaction.conversationId || "Pending" },
    { label: "Registered Customer", value: transaction.isRegisteredCustomer !== null ? (transaction.isRegisteredCustomer ? "Yes" : "No") : "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-sm text-gray-500">
            {formatPhone(transaction.partyB)} - {formatCurrency(transaction.amount)}
          </p>
        </div>
        <Badge variant={statusVariant[transaction.status] || "default"} className="ml-auto text-sm px-3 py-1">
          {transaction.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-xs text-gray-500 font-medium">{item.label}</dt>
                <dd className="text-sm text-gray-900 font-medium break-all">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
