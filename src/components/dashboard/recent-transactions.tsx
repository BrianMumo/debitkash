"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPhone, formatRelativeTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { TransactionListItem } from "@/types/mpesa";
import type { BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "error",
  TIMED_OUT: "error",
};

interface RecentTransactionsProps {
  transactions: TransactionListItem[];
  loading: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Send your first payment to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((txn) => (
              <Link
                key={txn.id}
                href={`/payments/${txn.id}`}
                className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {txn.recipientName || formatPhone(txn.partyB)}
                    </p>
                    <Badge variant={statusVariant[txn.status] || "default"}>
                      {txn.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(txn.createdAt)}
                    {txn.remarks && ` - ${txn.remarks}`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-4">
                  {formatCurrency(txn.amount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
