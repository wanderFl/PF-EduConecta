import React from 'react';
import { LogoutButton } from '../auth/LogoutButton';
import { useAuth } from '../../hooks/useAuth';

interface DashboardNavbarProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  title = 'EduConecta',
  subtitle = 'Sistema Educativo',
  icon = '🎓'
}) => {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">{icon}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <LogoutButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};