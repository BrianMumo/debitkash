"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatPhone, formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import type { TransactionListItem } from "@/types/mpesa";
import type { BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "error",
  TIMED_OUT: "error",
};

const reversalLabel: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Reversing…", variant: "warning" },
  SUCCESS: { label: "Reversed", variant: "default" },
  FAILED: { label: "Reversal failed", variant: "error" },
  TIMED_OUT: { label: "Reversal timed out", variant: "error" },
};

function canReverse(txn: TransactionListItem): boolean {
  return (
    txn.status === "SUCCESS" &&
    !!txn.mpesaTransactionId &&
    (txn.reversalStatus === "NONE" ||
      txn.reversalStatus === "FAILED" ||
      txn.reversalStatus === "TIMED_OUT")
  );
}

const statusOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "TIMED_OUT", label: "Timed Out" },
];

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reverseTarget, setReverseTarget] = useState<TransactionListItem | null>(null);
  const [reversing, setReversing] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [status, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchTransactions(1);
  }

  async function handleReverse() {
    if (!reverseTarget) return;
    setReversing(true);
    try {
      const res = await fetch("/api/mpesa/reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: reverseTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reversal failed");
      toast(data.message || "Reversal initiated", "success");
      setReverseTarget(null);
      fetchTransactions(pagination.page);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reversal failed", "error");
    } finally {
      setReversing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and filter your B2C payment history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          // Export to CSV
          const csv = [
            ["Date", "Recipient", "Phone", "Amount", "Status", "Receipt"].join(","),
            ...transactions.map(t => [
              formatDate(t.createdAt),
              t.recipientName || "",
              t.partyB,
              t.amount,
              t.status,
              t.mpesaTransactionId || "",
            ].join(","))
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                id="search"
                placeholder="Search by phone, name, or receipt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              id="status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination.total} Transaction{pagination.total !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Recipient</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Phone</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">Amount</th>
                      <th className="text-center py-3 px-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Receipt</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-600">{formatDate(txn.createdAt)}</td>
                        <td className="py-3 px-3">
                          <Link href={`/payments/${txn.id}`} className="font-medium text-gray-900 hover:text-emerald-600">
                            {txn.recipientName || "-"}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{formatPhone(txn.partyB)}</td>
                        <td className="py-3 px-3 text-right font-semibold">{formatCurrency(txn.amount)}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={statusVariant[txn.status] || "default"}>{txn.status}</Badge>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-xs">
                          {txn.mpesaTransactionId || "-"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {txn.reversalStatus !== "NONE" && reversalLabel[txn.reversalStatus] && (
                              <Badge variant={reversalLabel[txn.reversalStatus].variant}>
                                {reversalLabel[txn.reversalStatus].label}
                              </Badge>
                            )}
                            {canReverse(txn) && (
                              <Button variant="outline" size="sm" onClick={() => setReverseTarget(txn)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                                {txn.reversalStatus === "NONE" ? "Reverse" : "Retry"}
                              </Button>
                            )}
                            {txn.reversalStatus === "NONE" && !canReverse(txn) && (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-2">
                {transactions.map((txn) => (
                  <div key={txn.id} className="rounded-lg border border-gray-100">
                    <Link
                      href={`/payments/${txn.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {txn.recipientName || formatPhone(txn.partyB)}
                          </p>
                          <Badge variant={statusVariant[txn.status] || "default"}>
                            {txn.status}
                          </Badge>
                          {txn.reversalStatus !== "NONE" && reversalLabel[txn.reversalStatus] && (
                            <Badge variant={reversalLabel[txn.reversalStatus].variant}>
                              {reversalLabel[txn.reversalStatus].label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(txn.createdAt)}</p>
                      </div>
                      <p className="text-sm font-semibold ml-4">{formatCurrency(txn.amount)}</p>
                    </Link>
                    {canReverse(txn) && (
                      <div className="px-3 pb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setReverseTarget(txn)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {txn.reversalStatus === "NONE" ? "Reverse" : "Retry reversal"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchTransactions(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchTransactions(pagination.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reverse confirmation */}
      <Dialog
        open={!!reverseTarget}
        onClose={() => {
          if (!reversing) setReverseTarget(null);
        }}
      >
        <DialogTitle>Reverse Payment</DialogTitle>
        <DialogDescription>
          This reverses the M-Pesa payment and pulls the funds back to your
          paybill. This cannot be undone.
        </DialogDescription>
        {reverseTarget && (
          <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Recipient</span>
              <span className="text-sm font-medium">
                {reverseTarget.recipientName || formatPhone(reverseTarget.partyB)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="text-sm font-medium">{formatPhone(reverseTarget.partyB)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(reverseTarget.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Receipt</span>
              <span className="text-sm font-mono">{reverseTarget.mpesaTransactionId}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setReverseTarget(null)}
            disabled={reversing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleReverse}
            loading={reversing}
          >
            <RotateCcw className="h-4 w-4" />
            Reverse Payment
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
