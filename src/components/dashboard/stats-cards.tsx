import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, CheckCircle, Calendar } from "lucide-react";

interface StatsCardsProps {
  totalToday: number;
  countToday: number;
  successRate: number;
  totalMonth: number;
}

export function StatsCards({ totalToday, countToday, successRate, totalMonth }: StatsCardsProps) {
  const stats = [
    {
      label: "Sent Today",
      value: formatCurrency(totalToday),
      icon: ArrowUpRight,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Transactions Today",
      value: countToday.toString(),
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Success Rate",
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "This Month",
      value: formatCurrency(totalMonth),
      icon: Calendar,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
