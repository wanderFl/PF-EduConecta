export type SubjectStudentRow = {
  student_id: number;
  student_name: string;
  avg: number | null;          // promedio individual (solo sobre entregas con nota)
  delivered_count: number;     // entregas registradas (SubmissionGrade)
  late_count: number;          // tareas vencidas sin entrega (ver nota)
};

export type SubjectStudentsSummary = {
  total_students: number;
  total_tasks: number;            // # de tareas de esa materia en el curso
  total_expected_submissions: number; // total_students * total_tasks
  total_delivered: number;           // sum(delivered_count)
  overall_delivered_pct: number;     // total_delivered / total_expected_submissions * 100
  total_late: number;                // sum(late_count)
  late_pct_over_past_due: number;    // total_late / (total_students * tasksPastDue) * 100
  low_performance_count: number;     // estudiantes con avg < 7
};

export type SubjectStudentsPayload = {
  course_id: number;
  subject_id: number;
  subject_name: string;
  items: SubjectStudentRow[];
  summary: SubjectStudentsSummary;
};

// types.ts (backend)
export interface StudentTaskRow {
  task_id: string;
  title: string;
  due_date: Date;
  submitted_at: Date | null;
  grade: number | null;
  trimestre: number | null;
  aporte: number | null;
  status: "ENTREGADA" | "NO_ENTREGADA" | "ENTREGADA_TARDE";

  // 👇 NUEVO
  instructions: string | null;
  file_url: string | null;
}

export interface StudentSubjectTasksPayload {
  course_id: number;
  subject_id: number;
  subject_name: string;
  student_id: number;
  student_name: string;
  items: StudentTaskRow[];
}
