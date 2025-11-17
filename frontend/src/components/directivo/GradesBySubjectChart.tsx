import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { GradesBySubjectItem } from "../../types";
import { useNavigate } from "react-router-dom";

type ChartRow = {
  subjectId: number;      // 👈 nuevo
  name: string;
  avg: number;
  raw: number | null;
  totalTasks: number;
  deliveredPct: number;
  deliveredCount: number;
  expected: number;
};

type Props = { data: GradesBySubjectItem[] };

function colorForAvg(avg: number | null): string {
  if (avg == null) return "#9ca3af";        // gris (sin notas)
  if (avg >= 9) return "#16a34a";           // verde (10-9)
  if (avg >= 7) return "#b08900";           // dorado/naranja (8-7)
  return "#dc2626";                          // rojo (<7)
}

// ❗ Tipar el Tooltip usando los tipos de Recharts:
const CustomTooltip: React.FC<
  TooltipProps<ValueType, NameType> & {
    payload?: { payload?: ChartRow }[];
    label?: string;
  }
> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: "8px 10px",
      boxShadow: "0 6px 16px rgba(0,0,0,.08)",
      fontSize: 13
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{label as string}</div>
      <div><b>Promedio:</b> {Number.isFinite(p.avg) ? p.avg.toFixed(2) : "—"}</div>
      <div><b>Total de tareas:</b> {p.totalTasks}</div>
      <div><b>% de entregas:</b> {p.deliveredPct.toFixed(0)}%</div>
    </div>
  );
};

const GradesBySubjectChart: React.FC<Props> = ({ data }) => {
  const chartData: ChartRow[] = useMemo(
    () =>
      data.map((d) => ({
        subjectId: d.subject_external_id,     // 👈 incluirlo desde el backend
        name: d.subject_name,
        avg: d.avg ?? 0,
        raw: d.avg ?? null,
        totalTasks: d.total_tasks,
        deliveredPct: d.delivered_pct,
        deliveredCount: d.delivered_count,
        expected: d.expected_submissions,
      })),
    [data]
  );
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-title">Rendimiento Académico por Materia</div>
      <div className="card-sub">Promedio general por materia del curso seleccionado</div>

      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" cursor="pointer">
              {/* (2) Click por celda usando el índice */}
              {chartData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={colorForAvg(entry.raw)}
                  onClick={() => {
                    const subjectId = chartData[idx].subjectId;
                    if (subjectId) navigate(`/directivo/grades/subject/${subjectId}`);
                  }}
                />
              ))}
              <LabelList
                dataKey="avg"
                position="top"
                formatter={(value: unknown) =>
                  typeof value === "number" ? value.toFixed(2) : ""
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export default GradesBySubjectChart;
