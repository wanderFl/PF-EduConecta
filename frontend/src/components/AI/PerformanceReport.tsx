import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import type { AIAnalysis, AIMetrics } from '../../services/aiService';
import './PerformanceReport.css';

interface Props {
  studentExternalId: string;
  studentName?: string;
}

interface Promedio {
  nombre: string;
  promedio: number;
  estado: string;
}

interface AIReport {
  analysis: AIAnalysis;
  metrics: AIMetrics;
}

export const PerformanceReport: React.FC<Props> = ({ studentExternalId, studentName }) => {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await aiService.generatePerformanceReport(studentExternalId);
      console.log('📊 Respuesta del backend:', result);
      
      // El backend devuelve { success, report, analysis, metrics }
      setReport({
        analysis: result.analysis,
        metrics: result.metrics
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar el reporte. Intenta nuevamente.';
      setError(errorMessage);
      console.error('❌ Error en frontend:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="performance-report-container">
      <div className="report-header">
        <h2>📊 Reporte de Rendimiento con IA</h2>
        <p className="student-name">{studentName}</p>
      </div>

      <div className="report-actions">
        <button 
          onClick={generateReport} 
          disabled={loading}
          className="btn-generate"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generando reporte con IA...
            </>
          ) : (
            <>
              <span className="icon">🤖</span>
              Generar Reporte Inteligente
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <p>⏳ La inteligencia artificial está analizando el rendimiento del estudiante...</p>
          <p className="loading-subtitle">Esto puede tomar hasta 30 segundos</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {report && (
        <div className="report-content">
          {/* Resumen General */}
          <section className="report-section summary-section">
            <h3>📝 Resumen General</h3>
            <p className="summary-text">{report.analysis.resumen_general}</p>
          </section>

          {/* Promedios */}
          {report.analysis.promedios && (
            <section className="report-section promedios-section">
              <h3>📊 Promedios</h3>
              <div className="promedio-general-card">
                <span className="metric-icon">📈</span>
                <div className="metric-info">
                  <span className="metric-label">Promedio General</span>
                  <span className="metric-value">
                    {report.analysis.promedios.promedio_general.toFixed(2)}/10
                  </span>
                </div>
              </div>
              {report.analysis.promedios.materias && report.analysis.promedios.materias.length > 0 && (
                <div className="materias-grid">
                  {report.analysis.promedios.materias.map((materia: Promedio, index: number) => (
                    <div 
                      key={index} 
                      className={`materia-card ${
                        materia.promedio >= 8 ? 'excelente' : 
                        materia.promedio >= 7 ? 'aprobado' : 
                        'requiere-atencion'
                      }`}
                    >
                      <h4>{materia.nombre}</h4>
                      <span className="materia-promedio">{materia.promedio.toFixed(2)}/10</span>
                      <span className="materia-estado">{materia.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {report.metrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-icon">📅</span>
                <div className="metric-info">
                  <span className="metric-label">Asistencia</span>
                  <span className="metric-value">{report.metrics.attendance_rate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">⭐</span>
                <div className="metric-info">
                  <span className="metric-label">Comportamiento</span>
                  <span className="metric-value">{report.metrics.behavior_score.toFixed(1)}/10</span>
                </div>
              </div>
            </div>
          )}

          {/* Fortalezas Identificadas */}
          {report.analysis.fortalezas_identificadas && report.analysis.fortalezas_identificadas.length > 0 && (
            <section className="report-section strengths-section">
              <h3>✅ Fortalezas Identificadas (Notas ≥ 8.0)</h3>
              <ul className="strengths-list">
                {report.analysis.fortalezas_identificadas.map((fortaleza, index) => (
                  <li key={index} className="strength-item">
                    <span className="bullet">✓</span>
                    {fortaleza}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Áreas que Requieren Atención */}
          {report.analysis.areas_requieren_atencion && report.analysis.areas_requieren_atencion.length > 0 && (
            <section className="report-section concerns-section">
              <h3>⚠️ Áreas que Requieren Atención (Notas ≤ 7.0)</h3>
              <ul className="concerns-list">
                {report.analysis.areas_requieren_atencion.map((area, index) => (
                  <li key={index} className="concern-item">
                    <span className="bullet">⚠</span>
                    {area}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Consejos para el Estudiante */}
          {report.analysis.consejos_estudiante && report.analysis.consejos_estudiante.length > 0 && (
            <section className="report-section student-tips-section">
              <h3>💡 Consejos para el Estudiante</h3>
              <div className="student-tips-grid">
                {report.analysis.consejos_estudiante.map((consejo, index) => (
                  <div key={index} className="tip-card">
                    <span className="tip-icon">💡</span>
                    <p className="tip-text">{consejo.replace('💡 ', '')}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recomendaciones para Padres */}
          {report.analysis.recomendaciones_padres && report.analysis.recomendaciones_padres.length > 0 && (
            <section className="report-section recommendations-section">
              <h3>💡 Recomendaciones para Padres de Familia</h3>
              <ol className="recommendations-list">
                {report.analysis.recomendaciones_padres.map((recomendacion, index) => (
                  <li key={index} className="recommendation-item">
                    {recomendacion}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Plan de Acción */}
          {report.analysis.plan_accion && (
            <section className="report-section action-plan-section">
              <h3>📋 Plan de Acción (30 Días)</h3>
              <div className="action-plan-content">
                <p className="plan-accion-text">{report.analysis.plan_accion}</p>
              </div>
            </section>
          )}

          <div className="report-footer">
            <p className="disclaimer">
              ℹ️ Este reporte ha sido generado por inteligencia artificial y debe ser usado como
              guía complementaria. Para decisiones importantes, consulte con los docentes y
              autoridades educativas de la institución.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
