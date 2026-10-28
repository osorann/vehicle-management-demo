"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthBucket } from "@/lib/domain/stats";
import { formatYen } from "@/lib/domain/stats";

const SERIES = "#1d4ed8"; // blue-700（単系列なので凡例は不要。タイトルで系列名を示す）
const GRID = "#e2e8f0";
const AXIS = "#64748b";

function MonthlyBarChart({
  data,
  valueLabel,
  formatValue,
  ariaLabel,
}: {
  data: MonthBucket[];
  valueLabel: string;
  formatValue: (v: number) => string;
  ariaLabel: string;
}) {
  return (
    <figure>
      <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 224 }}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS, fontSize: 12 }} interval={0} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 12 }}
              width={valueLabel === "台数" ? 28 : 56}
              allowDecimals={false}
              tickFormatter={(v: number) => (valueLabel === "台数" ? String(v) : `${Math.round(v / 1000)}千`)}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.15)" }}
              formatter={(v) => [formatValue(Number(v)), valueLabel]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.month?.replace("-", "年") + "月"}
              contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }}
            />
            <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* グラフの代替となる表（スクリーンリーダー向け） */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>月</th>
            <th>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function InspectionDueChart({ data }: { data: MonthBucket[] }) {
  return (
    <MonthlyBarChart
      data={data}
      valueLabel="台数"
      formatValue={(v) => `${v}台`}
      ariaLabel="今後12ヶ月の車検満了台数（月別）"
    />
  );
}

export function MaintenanceCostChart({ data }: { data: MonthBucket[] }) {
  return (
    <MonthlyBarChart
      data={data}
      valueLabel="整備費用"
      formatValue={formatYen}
      ariaLabel="過去6ヶ月の整備費用（月別）"
    />
  );
}
