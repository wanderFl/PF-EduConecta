import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../../types";

const Asistencia: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    useEffect(() => {
        const courseData = localStorage.getItem('selectedCourseData');
        if (!courseData) {
            navigate('/docente');
            return;
        }
        
        try {
            const course = JSON.parse(courseData);
            setSelectedCourse(course);
        } catch {
            navigate('/docente');
        }
    }, [navigate]);

    if (!selectedCourse) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Registro de Asistencia
                            </h1>
                            <p className="text-gray-600">
                                Curso: {selectedCourse.name}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/docente/dashboard")}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            Volver al Dashboard
                        </button>
                    </div>
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            Módulo de Asistencia para {selectedCourse.name} en desarrollo...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Asistencia;