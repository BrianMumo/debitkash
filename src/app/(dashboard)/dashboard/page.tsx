"use client";

import { useCallback, useEffect, useState } from "react";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { QuickPayForm } from "@/components/dashboard/quick-pay-form";
import type { TransactionListItem, BalanceData } from "@/types/mpesa";

export default function DashboardPage() {
  const [balance, setBalance] = useState<BalanceData>({
    utilityAccountBalance: null,
    workingAccountBalance: null,
    chargesAccountBalance: null,
    lastUpdated: null,
    status: "PENDING",
  });
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    countToday: 0,
    successRate: 0,
    totalMonth: 0,
  });
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/mpesa/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?limit=5");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);

        // Calculate stats from recent transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const allRes = await fetch("/api/transactions?limit=1000");
        if (allRes.ok) {
          const allData = await allRes.json();
          const allTxns = allData.transactions as TransactionListItem[];

          const todayTxns = allTxns.filter(
            (t) => new Date(t.createdAt) >= today
          );
          const monthTxns = allTxns.filter(
            (t) => new Date(t.createdAt) >= monthStart
          );
          const successTxns = allTxns.filter((t) => t.status === "SUCCESS");

          setStats({
            totalToday: todayTxns
              .filter((t) => t.status === "SUCCESS")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
            countToday: todayTxns.length,
            successRate: allTxns.length > 0
              ? (successTxns.length / allTxns.length) * 100
              : 0,
            totalMonth: monthTxns
              .filter((t) => t.status === "SUCCESS")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  function handleRefresh() {
    setLoadingBalance(true);
    fetchBalance();
    fetchTransactions();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your M-Pesa B2C payments
        </p>
      </div>

      {/* Balance + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BalanceCard
            utilityBalance={balance.utilityAccountBalance}
            workingBalance={balance.workingAccountBalance}
            chargesBalance={balance.chargesAccountBalance}
            lastUpdated={balance.lastUpdated}
            loading={loadingBalance}
            onRefresh={handleRefresh}
          />
        </div>
        <div className="lg:col-span-2">
          <StatsCards
            totalToday={stats.totalToday}
            countToday={stats.countToday}
            successRate={stats.successRate}
            totalMonth={stats.totalMonth}
          />
        </div>
      </div>

      {/* Recent Transactions + Quick Pay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} loading={loadingTxns} />
        </div>
        <div className="lg:col-span-1">
          <QuickPayForm onPaymentSent={handleRefresh} />
        </div>
      </div>
    </div>
  );
}
