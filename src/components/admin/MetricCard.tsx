"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  iconClassName?: string;
}

export const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconClassName,
}: MetricCardProps) => {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center bg-primary/10",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "font-medium",
                  isPositive && "text-green-600 dark:text-green-500",
                  isNegative && "text-red-600 dark:text-red-500",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}{change.value}%
              </span>
              <span className="text-muted-foreground">{change.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
