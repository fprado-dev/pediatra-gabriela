"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrowthAlertBadgeProps {
  alertCount: number;
  highSeverityCount?: number;
  className?: string;
}

export function GrowthAlertBadge({
  alertCount,
  highSeverityCount = 0,
  className,
}: GrowthAlertBadgeProps) {
  if (alertCount === 0) return null;

  const isHigh = highSeverityCount > 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs font-medium",
        isHigh
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-yellow-200 bg-yellow-50 text-yellow-700",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {alertCount} alerta{alertCount > 1 ? "s" : ""}
    </Badge>
  );
}

interface PercentileBadgeProps {
  percentile: number;
  previousPercentile?: number;
  label?: string;
  className?: string;
}

export function PercentileBadge({
  percentile,
  previousPercentile,
  label,
  className,
}: PercentileBadgeProps) {
  const change = previousPercentile ? percentile - previousPercentile : 0;
  const isLow = percentile < 15;
  const isHigh = percentile > 85;
  const hasDropped = change < -10;
  const hasIncreased = change > 10;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}:</span>}
      <Badge
        variant="secondary"
        className={cn(
          "text-xs",
          isLow && "bg-yellow-100 text-yellow-800",
          isHigh && "bg-blue-100 text-blue-800",
          hasDropped && "bg-red-100 text-red-800",
          !isLow && !isHigh && !hasDropped && "bg-green-100 text-green-800"
        )}
      >
        P{percentile}
        {change !== 0 && (
          <span className="ml-1 flex items-center">
            {hasDropped ? (
              <TrendingDown className="h-3 w-3" />
            ) : hasIncreased ? (
              <TrendingUp className="h-3 w-3" />
            ) : null}
          </span>
        )}
      </Badge>
    </div>
  );
}
