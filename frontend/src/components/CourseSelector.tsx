import React, { useState } from 'react';
import './CourseSelector.css';

export interface Course {
  id: number;
  name: string;
}

interface CourseSelectorProps {
  selectedCourse: string;
  onCourseChange: (courseId: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourse,
  onCourseChange,
  required = false,
  placeholder = "Seleccionar curso",
  className = ""
}) => {
  // Definir los cursos disponibles (basado en el sistema educativo ecuatoriano)
  const availableCourses: Course[] = [
    { id: 8, name: '8vo Año de Educación General Básica' },
    { id: 9, name: '9no Año de Educación General Básica' },
    { id: 10, name: '10mo Año de Educación General Básica' },
    { id: 11, name: '1ro de Bachillerato General Unificado' },
    { id: 12, name: '2do de Bachillerato General Unificado' },
    { id: 13, name: '3ro de Bachillerato General Unificado' }
  ];

  const [courses] = useState<Course[]>(availableCourses);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const handleCourseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = event.target.value;
    onCourseChange(courseId);
  };

  const getShortName = (course: Course): string => {
    const shortNames: { [key: number]: string } = {
      8: '8vo EGB',
      9: '9no EGB', 
      10: '10mo EGB',
      11: '1ro BGU',
      12: '2do BGU',
      13: '3ro BGU'
    };
    return shortNames[course.id] || course.name;
  };

  if (loading) {
    return (
      <div className={`course-selector loading ${className}`}>
        <label>Curso *</label>
        <select disabled>
          <option>Cargando cursos...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`course-selector error ${className}`}>
        <label>Curso *</label>
        <select disabled>
          <option>Error al cargar cursos</option>
        </select>
        <small className="error-message">{error}</small>
      </div>
    );
  }

  return (
    <div className={`course-selector ${className}`}>
      <label htmlFor="course-select">
        Curso {required && <span className="required">*</span>}
      </label>
      <select
        id="course-select"
        value={selectedCourse}
        onChange={handleCourseChange}
        required={required}
        className={selectedCourse ? 'has-value' : ''}
      >
        <option value="">{placeholder}</option>
        {courses.map(course => (
          <option key={course.id} value={course.id}>
            {getShortName(course)} - {course.name}
          </option>
        ))}
      </select>
      {selectedCourse && (
        <div className="selected-course-info">
          <i className="fas fa-info-circle"></i>
          <span>
            Curso seleccionado: {getShortName(courses.find(c => c.id === parseInt(selectedCourse)) || { id: 0, name: 'Desconocido' })}
          </span>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
