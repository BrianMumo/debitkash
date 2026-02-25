"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { RefreshCw, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface BalanceCardProps {
  utilityBalance: number | null;
  workingBalance: number | null;
  chargesBalance: number | null;
  lastUpdated: string | null;
  loading: boolean;
  onRefresh: () => void;
}

export function BalanceCard({
  utilityBalance,
  workingBalance,
  chargesBalance,
  lastUpdated,
  loading,
  onRefresh,
}: BalanceCardProps) {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/mpesa/balance", { method: "POST" });
      if (!res.ok) throw new Error("Failed to request balance");
      toast("Balance inquiry sent. It may take a moment to update.", "info");
      // Wait a bit then trigger parent refresh
      setTimeout(() => {
        onRefresh();
        setRefreshing(false);
      }, 3000);
    } catch {
      toast("Failed to request balance", "error");
      setRefreshing(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-200" />
          <CardTitle className="text-white text-base font-medium">Account Balance</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-emerald-200 hover:text-white hover:bg-emerald-500/30"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 bg-emerald-500/30" />
            <Skeleton className="h-4 w-32 bg-emerald-500/30" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-emerald-200 uppercase tracking-wider">Utility Account</p>
                <p className="text-3xl font-bold">
                  {utilityBalance !== null ? formatCurrency(utilityBalance) : "---"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-500/30">
                <div>
                  <p className="text-xs text-emerald-200">Working Account</p>
                  <p className="text-lg font-semibold">
                    {workingBalance !== null ? formatCurrency(workingBalance) : "---"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-200">Charges Account</p>
                  <p className="text-lg font-semibold">
                    {chargesBalance !== null ? formatCurrency(chargesBalance) : "---"}
                  </p>
                </div>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-xs text-emerald-200 mt-3">
                Last updated: {formatRelativeTime(lastUpdated)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
