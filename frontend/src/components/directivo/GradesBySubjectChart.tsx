import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { GradesBySubjectItem } from "../../types";

type ChartRow = {
  name: string;
  avg: number;             // 0..10 (si no hay, usamos 0)
  raw: number | null;      // null = sin notas
};

type Props = { data: GradesBySubjectItem[] };

function colorForAvg(avg: number | null): string {
  if (avg == null) return "#9ca3af";        // gris (sin notas)
  if (avg >= 9) return "#16a34a";           // verde (10-9)
  if (avg >= 7) return "#b08900";           // dorado/naranja (8-7)
  return "#dc2626";                          // rojo (<7)
}

const GradesBySubjectChart: React.FC<Props> = ({ data }) => {
  const chartData: ChartRow[] = useMemo(
    () =>
      data.map((d) => ({
        name: d.subject_name,
        avg: d.avg ?? 0,
        raw: d.avg ?? null,
      })),
    [data]
  );

  return (
    <div className="card">
      <div className="card-title">Rendimiento Académico por Materia</div>
      <div className="card-sub">Promedio general por materia del curso seleccionado</div>
      
      {/* 📊 Leyenda de colores */}
      <div className="grade-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#16a34a" }}></span>
          <span>10 - 9: Excelente</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#b08900" }}></span>
          <span>8 - 7: Satisfactorio</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#dc2626" }}></span>
          <span>&lt; 7: En riesgo</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#9ca3af" }}></span>
          <span>Sin notas</span>
        </div>
      </div>

      {/* 📈 Gráfico */}
      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} />
            <Tooltip
              formatter={(value: number) => Number.isFinite(value) ? value.toFixed(2) : "—"}
              labelStyle={{ fontWeight: 700 }}
            />
            <Bar dataKey="avg">
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colorForAvg(entry.raw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GradesBySubjectChart;
