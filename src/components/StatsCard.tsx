// Adapted from the 21st.dev "Stats Card" component (ravikatiyar162/stats-card-1).
// Self-contained: only depends on React and Tailwind CSS.
import React from "react";

export interface StatsCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  change: string;
  /** "positive" = good news (green), "negative" = bad news (red). */
  changeType: "positive" | "negative";
  period?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType,
  period = "vs last 24h",
  className = "",
}) => {
  const changeColor =
    changeType === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div
      className={`w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        <span className={changeColor}>{change}</span> {period}
      </p>
    </div>
  );
};

/** Example usage: SOC overview KPIs. */
export const StatsCardDemo: React.FC = () => (
  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard title="Alertes ouvertes" value="128" change="+12%" changeType="negative" />
    <StatsCard title="Incidents critiques" value="3" change="-40%" changeType="positive" />
    <StatsCard title="MTTR" value="42 min" change="-8%" changeType="positive" />
    <StatsCard title="Endpoints surveillés" value="1 204" change="+2%" changeType="positive" />
  </div>
);

export default StatsCard;
