import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFamily } from "../contexts/useFamily";
import FamilyHeader from "../components/familia/FamilyHeader";
import { getLinkedChildren, getMonthlyAttendance } from "../services/familia";
import type { CeiafStudent, AttendanceStatus } from "../types";
import { useNavigate } from "react-router-dom";
import AbsenceJustificationModal from "../components/familia/AbsenceJustificationModal";
import "./familia.css";

function getMonthMatrix(year: number, month: number) {
  // month: 1-12
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = first.getUTCDay(); // 0=Dom ... 6=Sab

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(Date.UTC(year, month - 1, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const statusClass: Record<AttendanceStatus, string> = {
  PRESENT: "att-present",
  ABSENT_UNJUSTIFIED: "att-absent",
  ABSENT_JUSTIFIED_PENDING: "att-pending",
  ABSENT_JUSTIFIED_ACCEPTED: "att-present",
};

const MonthlyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedStudent, setSelectedStudent } = useFamily();
  const [students, setStudents] = useState<CeiafStudent[]>([]);
  const today = new Date();
  const [year, setYear] = useState<number>(today.getUTCFullYear());
  const [month, setMonth] = useState<number>(today.getUTCMonth() + 1); // 1-12

  const parentName = useMemo(() => user?.email?.split("@")[0] ?? "Familia", [user]);
  const [att, setAtt] = useState<Map<string, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  // --- estado para justificación ---
  const [justModalOpen, setJustModalOpen] = useState(false);
  const [justDate, setJustDate] = useState<string | null>(null);

  // cargar hijos
  useEffect(() => {
    (async () => {
      const list = await getLinkedChildren();
      setStudents(list);
      if (!selectedStudent && list.length > 0) setSelectedStudent(list[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar asistencia del mes
  const fetchMonth = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const data = await getMonthlyAttendance({
        studentId: selectedStudent.id_estudiante,
        year,
        month,
      });
      const map = new Map<string, AttendanceStatus>();
      data.days.forEach((d) => map.set(d.date, d.status));
      setAtt(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, year, month]);

  const weeks = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const handlePrevMonth = () => {
    const m = month - 1;
    if (m < 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth(m);
    }
  };
  const handleNextMonth = () => {
    const m = month + 1;
    if (m > 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth(m);
    }
  };
  const handleChangeStudent = (id: number) => {
    const s = students.find(st => st.id_estudiante === id) ?? null;
    setSelectedStudent(s);
  };

  const onDayClick = (ymd: string, status?: AttendanceStatus) => {
    if (status === "ABSENT_UNJUSTIFIED") {
      setJustDate(ymd);
      setJustModalOpen(true);
    }
  };

  const monthName = new Date(Date.UTC(year, month - 1, 1))
    .toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="fam-layout">
      <FamilyHeader
        parentName={parentName}
        students={students}
        selected={selectedStudent}
        onChangeStudent={handleChangeStudent}
        onOpenAddChild={() => navigate("/familia")}
      />

      <div className="fam-body">
        <div className="fam-main">
          {/* Breadcrumb */}
          <nav className="fam-breadcrumb">
            <span className="crumb-link" onClick={() => navigate("/familia")}>Inicio</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Calendario Mensual de Asistencia</span>
          </nav>

          {/* Header de mes + nav */}
          <section className="student-info-card">
            <div className="sic-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="nav-arrow" onClick={handlePrevMonth} aria-label="Mes anterior">‹</button>
              <div style={{ fontWeight: 800, textTransform: "capitalize" }}>{monthName}</div>
              <button className="nav-arrow" onClick={handleNextMonth} aria-label="Mes siguiente">›</button>
            </div>
            <div className="muted">Haz clic en un día rojo para justificar.</div>
          </section>

          {/* Leyenda */}
          <section className="legend">
            <span className="legend-dot att-present" /> Asistió / Justificación aceptada
            <span className="legend-dot att-absent" /> Falta injustificada
            <span className="legend-dot att-pending" /> Justificación pendiente
            <span className="legend-dot att-none" /> Sin registro (no tomada)
          </section>

          {/* Calendario mensual */}
          <section className="month-grid">
            <div className="week-header">
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
                <div key={d} className="wh-cell">{d}</div>
              ))}
            </div>

            <div className="week-rows">
              {loading ? (
                <div className="muted" style={{ padding: 12 }}>Cargando asistencia…</div>
              ) : weeks.map((week, wi) => (
                <div key={wi} className="week-row">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="day-cell empty" />;
                    const ymd = day.toISOString().slice(0, 10);
                    const st = att.get(ymd) as AttendanceStatus | undefined;
                    const cls = st ? statusClass[st] : "att-none";
                    const dayNum = day.getUTCDate();
                    const clickable = st === "ABSENT_UNJUSTIFIED";
                    return (
                      <div
                        key={di}
                        className={`day-cell ${cls} ${clickable ? "clickable" : ""}`}
                        onClick={() => clickable && onDayClick(ymd, st)}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : -1}
                        aria-label={clickable ? `Justificar inasistencia del ${ymd}` : undefined}
                      >
                        <div className="day-num">{dayNum}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="fam-sidebar" />
      </div>

      {/* Modal de Justificación */}
      <AbsenceJustificationModal
        open={justModalOpen}
        dateISO={justDate}
        onClose={() => setJustModalOpen(false)}
        onSubmitted={fetchMonth}
      />
    </div>
  );
};

export default MonthlyAttendancePage;
