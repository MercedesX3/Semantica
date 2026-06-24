"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { VisualizationData, ChunkPoint, VisualizationMode } from "@/lib/api";

interface ChunkChartProps {
  data: VisualizationData;
  mode: VisualizationMode;
}

function getColor(index: number, total: number): string {
  const ratio = index / Math.max(total - 1, 1);
  // Interpolate from indigo (early) → violet (mid) → rose (late)
  const r = Math.round(99 + (244 - 99) * ratio);
  const g = Math.round(102 + (63 - 102) * ratio);
  const b = Math.round(241 + (114 - 241) * ratio);
  return `rgb(${r},${g},${b})`;
}

interface TooltipPayload {
  payload: ChunkPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 max-w-xs text-sm">
      <p className="font-semibold text-zinc-700 mb-1">Chunk {point.chunk_index + 1}</p>
      <p className="text-zinc-500 text-xs leading-relaxed">{point.text_preview}</p>
      {point.word_count && (
        <p className="text-zinc-400 text-xs mt-1">{point.word_count} words</p>
      )}
    </div>
  );
}

export default function ChunkChart({ data, mode }: ChunkChartProps) {
  const total = data.points.length;
  const variance = data.variance_explained;
  const totalVariance = Math.round((variance[0] + variance[1]) * 100);
  const label = mode === "emotion" ? "Emotion" : "Topic";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-800">{data.title}</h3>
        <p className="text-xs text-zinc-500">
          {total} chunks · {label} PCA explains {totalVariance}% of variance
        </p>
        {data.axis_labels && (
          <p className="text-xs text-zinc-400 mt-0.5">
            PC1: {data.axis_labels[0]} · PC2: {data.axis_labels[1]}
          </p>
        )}
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              dataKey="x"
              tick={false}
              axisLine={false}
              tickLine={false}
              label={{ value: `${label} PC1`, position: "insideBottom", offset: -2, fontSize: 10, fill: "#a1a1aa" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tick={false}
              axisLine={false}
              tickLine={false}
              label={{ value: `${label} PC2`, angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#a1a1aa" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data.points}>
              {data.points.map((point) => (
                <Cell
                  key={point.chunk_index}
                  fill={getColor(point.chunk_index, total)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span>Early chapters</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <span>Later chapters</span>
        </div>
      </div>
    </div>
  );
}
