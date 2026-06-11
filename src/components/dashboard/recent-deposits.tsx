"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPayerPhone, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, ArrowDownLeft } from "lucide-react";
import type { DepositListItem } from "@/types/mpesa";

interface RecentDepositsProps {
  deposits: DepositListItem[];
  loading: boolean;
}

export function RecentDeposits({ deposits, loading }: RecentDepositsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Deposits</CardTitle>
        <Link
          href="/deposits"
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
        ) : deposits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No deposits yet</p>
            <p className="text-xs mt-1">
              Incoming paybill payments will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {deposits.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-50 shrink-0">
                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {dep.payerName || formatPayerPhone(dep.msisdn)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeTime(dep.createdAt)}
                      {dep.billRefNumber && ` - ${dep.billRefNumber}`}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-emerald-600 ml-4">
                  +{formatCurrency(dep.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
