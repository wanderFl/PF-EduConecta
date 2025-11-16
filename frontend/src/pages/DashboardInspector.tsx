// src/pages/DashboardInspector.tsx
import React from 'react';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';

export const DashboardInspector: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation Bar */}
            <DashboardNavbar 
                title="EduConecta"
                subtitle="Panel de Inspector"
                icon="🔍"
            />
            
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Panel de Inspector
                    </h1>
                    <p className="text-gray-600">
                        Sistema de supervisión y control educativo
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Supervisión Académica */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Supervisión Académica
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Monitoreo del desempeño académico
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Acceder
                        </button>
                    </div>

                    {/* Control de Asistencia */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Control de Asistencia
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Supervisión de asistencia general
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Acceder
                        </button>
                    </div>

                    {/* Evaluación de Docentes */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👨‍🏫</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Evaluación Docente
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Supervisión del desempeño docente
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            Acceder
                        </button>
                    </div>

                    {/* Reportes e Informes */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Reportes e Informes
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Generación de reportes oficiales
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                            Acceder
                        </button>
                    </div>

                    {/* Cumplimiento Normativo */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">⚖️</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Cumplimiento Normativo
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Verificación de normativas educativas
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            Acceder
                        </button>
                    </div>

                    {/* Comunicaciones Oficiales */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Comunicaciones Oficiales
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Gestión de comunicados oficiales
                                </p>
                            </div>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                            Acceder
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Resumen de Actividades
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">125</div>
                            <div className="text-sm text-gray-500">Docentes Supervisados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">98%</div>
                            <div className="text-sm text-gray-500">Asistencia Promedio</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">45</div>
                            <div className="text-sm text-gray-500">Evaluaciones Realizadas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">12</div>
                            <div className="text-sm text-gray-500">Reportes Generados</div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>Sistema EduConecta - Panel de Inspector | Última actualización: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};