import React, { useState, useEffect, useCallback } from 'react';
import { agendaService } from '../services/agenda';
import type { Task, TaskStats } from '../services/agenda';
import './AgendaEscolar.css';

interface AgendaEscolarProps {
  className?: string;
}

const AgendaEscolar: React.FC<AgendaEscolarProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: ''
  });

  // Obtener curso actual del localStorage
  useEffect(() => {
    const courseData = localStorage.getItem('selectedCourseData');
    if (courseData) {
      try {
        const course = JSON.parse(courseData);
        setCurrentCourseId(course.id);
        console.log('📚 Curso actual del docente:', course.id);
      } catch (err) {
        console.error('Error parsing course data:', err);
      }
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      let tasksData: Task[];
      
      // Siempre filtrar por el curso actual del docente
      if (currentCourseId) {
        console.log('📚 Cargando tareas para curso ID:', currentCourseId);
        tasksData = await agendaService.getTasksByCourse(currentCourseId);
        console.log('✅ Tareas cargadas:', tasksData.length);
      } else {
        // Si no hay curso seleccionado, mostrar array vacío
        tasksData = [];
      }
      
      setTasks(tasksData);
    } catch (err) {
      setError('Error al cargar las tareas');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCourseId]);



  const loadStats = useCallback(async () => {
    try {
      const filters: {
        course_id?: number;
        start_date?: string;
        end_date?: string;
      } = {};
      
      // Siempre usar el curso actual del docente
      if (currentCourseId) {
        filters.course_id = currentCourseId;
        console.log('📊 Cargando estadísticas para curso:', currentCourseId);
      } else {
        // Si no hay curso, no cargar estadísticas
        setStats(null);
        return;
      }
      
      if (dateRange.start) {
        filters.start_date = dateRange.start;
      }
      
      if (dateRange.end) {
        filters.end_date = dateRange.end;
      }

      const statsData = await agendaService.getTasksStats(filters);
      console.log('✅ Estadísticas cargadas:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats(null);
    }
  }, [currentCourseId, dateRange]);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  useEffect(() => {
    if (currentCourseId || dateRange.start || dateRange.end) {
      loadStats();
    }
  }, [currentCourseId, dateRange, loadStats]);

  // Efecto para recargar tareas cuando cambie el curso
  useEffect(() => {
    if (currentCourseId) {
      loadTasks();
    }
  }, [currentCourseId, loadTasks]);

  const filteredTasks = tasks.filter((task: Task) => {
    // Ya están filtradas por curso, solo aplicar filtro de fechas
    if (dateRange.start && new Date(task.due_date) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(task.due_date) > new Date(dateRange.end)) return false;
    return true;
  });

  const getCourseName = (courseId: number): string => {
    const courseNames: { [key: number]: string } = {
      8: '8vo',
      9: '9no', 
      10: '10mo',
      11: '1ro BGU',
      12: '2do BGU',
      13: '3ro BGU'
    };
    return courseNames[courseId] || `Curso ${courseId}`;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      overdue: { text: 'VENCIDA', color: 'badge-danger' },
      urgent: { text: 'URGENTE', color: 'badge-warning' },
      soon: { text: 'PRÓXIMA', color: 'badge-info' },
      normal: { text: 'NORMAL', color: 'badge-success' }
    };
    
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  if (loading) {
    return (
      <div className={`agenda-escolar ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando agenda escolar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`agenda-escolar ${className}`}>
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={loadTasks} className="retry-button">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`agenda-escolar ${className}`}>
      <div className="agenda-header">
        <h2>
          <i className="fas fa-calendar-alt"></i>
          Dashboard de Agenda Escolar
        </h2>
        
        {/* Filtros */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Desde:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Hasta:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>

          {(dateRange.start || dateRange.end) && (
            <button 
              onClick={() => {
                setDateRange({ start: '', end: '' });
              }}
              className="clear-filters-button"
            >
              <i className="fas fa-times"></i>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="stat-content">
              <h3>Total de Tareas</h3>
              <p className="stat-number">{stats.total_tasks}</p>
            </div>
          </div>
          
          <div className="stat-card overdue">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>Vencidas</h3>
              <p className="stat-number">{stats.overdue_tasks}</p>
            </div>
          </div>
          
          <div className="stat-card upcoming">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Próximas (7 días)</h3>
              <p className="stat-number">{stats.upcoming_tasks}</p>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="fas fa-edit"></i>
            </div>
            <div className="stat-content">
              <h3>Pendientes de Calificar</h3>
              <p className="stat-number">{stats.pending_grading}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="tasks-container">
        {!currentCourseId ? (
          <div className="no-tasks">
            <i className="fas fa-info-circle"></i>
            <p>Selecciona un curso para ver las tareas</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <i className="fas fa-calendar-check"></i>
            <p>No hay tareas creadas para este curso</p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map(task => {
              const priority = agendaService.getTaskPriority(task.due_date);
              const badge = getPriorityBadge(priority);
              
              return (
                <div key={task.id} className={`task-card priority-${priority}`}>
                  <div className="task-header">
                    <h3 className="task-title">{task.title}</h3>
                    <span className={`priority-badge ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>
                  
                  {task.instructions && (
                    <p className="task-instructions">{task.instructions}</p>
                  )}
                  
                  <div className="task-details">
                    <div className="task-info">
                      <div className="info-item">
                        <i className="fas fa-chalkboard-teacher"></i>
                        <span>Curso: {getCourseName(task.course_external_id)}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-user"></i>
                        <span>Docente: {task.teacher_external_id}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-calendar-plus"></i>
                        <span>Creada: {agendaService.formatDate(task.created_at)}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-calendar-times"></i>
                        <span className={agendaService.isTaskOverdue(task.due_date) ? 'overdue-date' : ''}>
                          Vence: {agendaService.formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="task-stats">
                      {task.max_points && (
                        <div className="stat-item">
                          <i className="fas fa-star"></i>
                          <span>Puntos máximos: {task.max_points}</span>
                        </div>
                      )}
                      <div className="stat-item">
                        <i className="fas fa-paper-plane"></i>
                        <span>Entregas: {task.submission_count || 0}</span>
                      </div>
                      <div className="stat-item">
                        <i className="fas fa-check-circle"></i>
                        <span>Calificadas: {task.graded_count || 0}</span>
                      </div>
                      {task.file_reference && (
                        <div className="stat-item">
                          <i className="fas fa-paperclip"></i>
                          <span>Archivo adjunto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaEscolar;