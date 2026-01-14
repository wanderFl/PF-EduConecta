import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import './TaskRecommendations.css';

interface Props {
  studentExternalId: string;
}

interface TaskOrder {
  task_id: number;
  title: string;
  priority: number;
  reason: string;
}

interface DailyPlan {
  [day: string]: string[];
}

interface AIRecommendation {
  reasoning: string;
  recommended_order: TaskOrder[];
  daily_plan: DailyPlan;
  tips: string[];
}

interface RecommendationData {
  recommendation: AIRecommendation;
}

export const TaskRecommendations: React.FC<Props> = ({ studentExternalId }) => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const result = await aiService.getTaskRecommendations(studentExternalId);
      
      if (result.message) {
        setError(result.message);
      } else {
        setRecommendations({ recommendation: result.recommendation });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar recomendaciones';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-recommendations-container">
      <div className="recommendations-header">
        <h2>📚 Recomendaciones Inteligentes de Tareas</h2>
        <p className="subtitle">La IA organiza las tareas por prioridad, dificultad y rendimiento</p>
      </div>

      <div className="recommendations-actions">
        <button 
          onClick={getRecommendations} 
          disabled={loading}
          className="btn-recommend"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generando recomendaciones...
            </>
          ) : (
            <>
              <span className="icon">🤖</span>
              Obtener Orden Recomendado
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <p>⏳ Analizando tareas pendientes y generando estrategia óptima...</p>
        </div>
      )}

      {error && (
        <div className="info-message">
          <span className="info-icon">ℹ️</span>
          <p>{error}</p>
        </div>
      )}

      {recommendations && (
        <div className="recommendations-content">
          <section className="reasoning-section">
            <h3>🎯 Estrategia de Priorización</h3>
            <p className="reasoning-text">{recommendations.recommendation.reasoning}</p>
          </section>

          {recommendations.recommendation.recommended_order && 
           recommendations.recommendation.recommended_order.length > 0 && (
            <section className="order-section">
              <h3>📝 Orden Recomendado</h3>
              <p className="order-subtitle">Sigue este orden para maximizar tu productividad:</p>
              <ol className="tasks-order-list">
                {recommendations.recommendation.recommended_order.map((task, index) => (
                  <li key={index} className="task-order-item">
                    <span className="task-number">{index + 1}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <p className="task-reason">{task.reason}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recommendations.recommendation.daily_plan && (
            <section className="daily-plan-section">
              <h3>📅 Plan Diario Sugerido</h3>
              <div className="daily-plan-grid">
                {Object.entries(recommendations.recommendation.daily_plan).map(([day, tasks]) => (
                  <div key={day} className="day-plan-card">
                    <h4 className="day-title">{day}</h4>
                    <ul className="day-tasks-list">
                      {Array.isArray(tasks) ? (
                        tasks.map((task: string, idx: number) => (
                          <li key={idx} className="day-task-item">{task}</li>
                        ))
                      ) : (
                        <li className="day-task-item">{tasks}</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendations.recommendation.tips && 
           recommendations.recommendation.tips.length > 0 && (
            <section className="tips-section">
              <h3>💡 Consejos para el Estudiante</h3>
              <div className="tips-grid">
                {recommendations.recommendation.tips.map((tip: string, index: number) => (
                  <div key={index} className="tip-card">
                    <span className="tip-icon">💡</span>
                    <p className="tip-text">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="recommendations-footer">
            <p className="disclaimer">
              ℹ️ Estas recomendaciones son generadas por IA y buscan optimizar el tiempo de estudio.
              Pueden ajustarse según las necesidades y ritmo personal del estudiante.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
