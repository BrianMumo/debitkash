"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPhone, formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Download, ArrowDownLeft } from "lucide-react";
import type { DepositListItem } from "@/types/mpesa";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<DepositListItem[]>([]);
  const [totalAmount, setTotalAmount] = useState("0");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchDeposits = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.set("search", search);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/deposits?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits);
        setPagination(data.pagination);
        setTotalAmount(data.totalAmount);
      }
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchDeposits(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Incoming customer payments to paybill
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const csv = [
            ["Date", "Payer", "Phone", "Account Ref", "Amount", "Receipt"].join(","),
            ...deposits.map(d => [
              formatDate(d.createdAt),
              d.payerName || "",
              d.msisdn || "",
              d.billRefNumber || "",
              d.amount,
              d.transId,
            ].join(","))
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `deposits-${new Date().toISOString().split("T")[0]}.csv`;
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
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Input
                id="search"
                placeholder="Search by phone, name, account, or receipt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {pagination.total} Deposit{pagination.total !== 1 ? "s" : ""}
          </CardTitle>
          <span className="text-sm font-semibold text-emerald-600">
            {formatCurrency(totalAmount)} total
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ArrowDownLeft className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No deposits found</p>
              <p className="text-sm mt-1">
                Incoming paybill payments will appear here once received
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Payer</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Phone</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Account Ref</th>
                      <th className="text-right py-3 px-3 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-3 px-3 text-gray-500 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-600">{formatDate(dep.createdAt)}</td>
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {dep.payerName || "-"}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {dep.msisdn ? formatPhone(dep.msisdn) : "-"}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{dep.billRefNumber || "-"}</td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                          +{formatCurrency(dep.amount)}
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-xs">
                          {dep.transId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-2">
                {deposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dep.payerName || (dep.msisdn ? formatPhone(dep.msisdn) : "Unknown")}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(dep.createdAt)}
                        {dep.billRefNumber && ` - ${dep.billRefNumber}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 ml-4">
                      +{formatCurrency(dep.amount)}
                    </p>
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
                      onClick={() => fetchDeposits(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchDeposits(pagination.page + 1)}
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
