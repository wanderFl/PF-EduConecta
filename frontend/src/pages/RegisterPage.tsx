import React from 'react';
import ParentRegistrationForm from '../components/auth/ParentRegistrationForm';
import './LoginPage.css';

const RegisterPage: React.FC = () => {
  return (
    <div className="login-page">
      <ParentRegistrationForm />
    </div>
  );
};

export default RegisterPage;