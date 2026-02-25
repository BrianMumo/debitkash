"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPhone, formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { TransactionListItem } from "@/types/mpesa";
import type { BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "error",
  TIMED_OUT: "error",
};

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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-2">
                {transactions.map((txn) => (
                  <Link
                    key={txn.id}
                    href={`/payments/${txn.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {txn.recipientName || formatPhone(txn.partyB)}
                        </p>
                        <Badge variant={statusVariant[txn.status] || "default"}>
                          {txn.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(txn.createdAt)}</p>
                    </div>
                    <p className="text-sm font-semibold ml-4">{formatCurrency(txn.amount)}</p>
                  </Link>
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
    </div>
  );
}
