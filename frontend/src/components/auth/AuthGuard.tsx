import React from 'react';
import { appContext } from '../../hooks/provider';
import LoginForm from './LoginForm';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { user } = React.useContext(appContext);
  const [showLogin, setShowLogin] = React.useState(false);

  React.useEffect(() => {
    // Check if user is authenticated
        const isAuthenticated = user && user.email;
    
    if (requireAuth && !isAuthenticated) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, requireAuth]);

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated, show login form
  if (showLogin) {
    return (
      <LoginForm
        onSuccess={() => setShowLogin(false)}
      />
    );
  }

  // If user is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;