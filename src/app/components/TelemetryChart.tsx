"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export interface DataPoint {
  time: string;
  latency: number;
  packets: number;
}

export default function TelemetryChart({ data, alertMode }: { data: DataPoint[]; alertMode: boolean }) {
  return (
    <div className="w-full h-24 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={alertMode ? "#ef4444" : "#00f0ff"} stopOpacity={0.4} />
              <stop offset="95%" stopColor={alertMode ? "#ef4444" : "#00f0ff"} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: alertMode ? "#ef4444" : "#00f0ff",
              fontSize: "10px",
              fontFamily: "monospace",
              borderRadius: "8px",
            }}
            itemStyle={{ color: alertMode ? "#f87171" : "#38bdf8" }}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke={alertMode ? "#ef4444" : "#00f0ff"}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#latencyGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}