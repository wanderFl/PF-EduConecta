import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../../types";
import { taskService } from "../../services/tasks";

interface TaskData {
    nombre: string;
    instrucciones: string;
    puntuacion: number;
    fechaVencimiento: string;
    archivo?: File;
}

const CreacionTareas: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [taskData, setTaskData] = useState<TaskData>({
        nombre: '',
        instrucciones: '',
        puntuacion: 0,
        fechaVencimiento: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTaskData(prev => ({
            ...prev,
            [name]: name === 'puntuacion' ? Number(value) : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        // Limpiar el input file
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleGuardarYEnviar = async () => {
        try {
                // Enviar al backend usando taskService (FormData)
                const res = await taskService.createTask({
                    nombre: taskData.nombre,
                    instrucciones: taskData.instrucciones,
                    puntuacion: taskData.puntuacion,
                    fechaVencimiento: taskData.fechaVencimiento,
                    cursoId: String(selectedCourse?.id ?? ''),
                    file: selectedFile ?? undefined
                });

                console.log('Respuesta creación tarea:', res);
                alert(`Tarea "${taskData.nombre}" creada y guardada en el servidor (id: ${res?.task?.id ?? 'n/a'})`);

                // Limpiar formulario
                setTaskData({
                    nombre: '',
                    instrucciones: '',
                    puntuacion: 0,
                    fechaVencimiento: ''
                });
                setSelectedFile(null);
            } catch (error) {
                console.error('Error al crear tarea:', error);
                alert('Error al crear la tarea');
            }
    };

    const handleCancelar = () => {
        navigate("/docente/dashboard");
    };

    if (!selectedCourse) {
        return <div>Cargando...</div>;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1rem 2rem',
                marginBottom: '2rem',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: selectedCourse.color,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginRight: '1rem'
                    }}>
                        CH
                    </div>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#2c3e50'
                        }}>
                            Carolina Herrera
                        </h1>
                        <p style={{
                            margin: 0,
                            color: '#7f8c8d',
                            fontSize: '0.9rem'
                        }}>
                            {selectedCourse.name} "A"
                        </p>
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#666'
            }}>
                Agenda Escolar Digital → Crear Tarea
            </div>

            {/* Formulario Principal */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '2rem',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
            }}>
                {/* Nombre de la Tarea */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#2c3e50'
                    }}>
                        Nombre de la Tarea *
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        value={taskData.nombre}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = selectedCourse.color}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        placeholder="Ingrese el nombre de la tarea"
                    />
                </div>

                {/* Instrucciones */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#2c3e50'
                    }}>
                        Instrucciones
                    </label>
                    <textarea
                        name="instrucciones"
                        value={taskData.instrucciones}
                        onChange={handleInputChange}
                        rows={6}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = selectedCourse.color}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        placeholder="Describa las instrucciones para la tarea..."
                    />
                </div>

                {/* Adjuntar Archivo */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => document.getElementById('fileInput')?.click()}
                        style={{
                            background: selectedCourse.color,
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: `0 4px 15px ${selectedCourse.color}30`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        📎 Adjuntar Archivo
                    </button>
                    <input
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                    {selectedFile && (
                        <div style={{ 
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ 
                                    fontSize: '1.2rem',
                                    marginRight: '0.5rem'
                                }}>
                                    📄
                                </span>
                                <div>
                                    <p style={{ 
                                        margin: '0',
                                        color: '#27ae60',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}>
                                        {selectedFile.name}
                                    </p>
                                    <p style={{ 
                                        margin: '0',
                                        color: '#6c757d',
                                        fontSize: '0.8rem'
                                    }}>
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveFile}
                                style={{
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#c82333';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#dc3545';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title="Quitar archivo"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Puntuación y Fecha */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Puntuación */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#2c3e50'
                        }}>
                            Puntuación Sobre
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="number"
                                name="puntuacion"
                                value={taskData.puntuacion}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                style={{
                                    width: '80px',
                                    padding: '0.75rem',
                                    border: '2px solid #e1e5e9',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    marginRight: '0.5rem'
                                }}
                                onFocus={(e) => e.target.style.borderColor = selectedCourse.color}
                                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                            />
                            <span style={{ color: '#666', fontWeight: '500' }}>Puntos</span>
                        </div>
                    </div>

                    {/* Fecha de Vencimiento */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#2c3e50'
                        }}>
                            Fecha de Vencimiento
                        </label>
                        <input
                            type="date"
                            name="fechaVencimiento"
                            value={taskData.fechaVencimiento}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e1e5e9',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = selectedCourse.color}
                            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                        />
                    </div>
                </div>

                {/* Botones de Acción */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e1e5e9'
                }}>
                    <button
                        onClick={handleCancelar}
                        style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#c82333';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc3545';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Cancelar
                    </button>
                    
                    <button
                        onClick={handleGuardarYEnviar}
                        disabled={!taskData.nombre.trim() || !taskData.fechaVencimiento}
                        style={{
                            background: taskData.nombre.trim() && taskData.fechaVencimiento 
                                ? '#28a745' 
                                : '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: taskData.nombre.trim() && taskData.fechaVencimiento 
                                ? 'pointer' 
                                : 'not-allowed',
                            transition: 'all 0.3s ease',
                            fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.background = '#218838';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.background = '#28a745';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        Guardar y Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreacionTareas;