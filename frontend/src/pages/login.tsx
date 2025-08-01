import * as React from "react";
import LoginForm from "../components/auth/LoginForm";
import { appContext } from "../hooks/provider";

const LoginPage = () => {
  const { user } = React.useContext(appContext);

  // If user is already authenticated, redirect to home
  React.useEffect(() => {
      if (user && user.email) {
      window.location.href = "/";
    }
  }, [user]);

    if (user && user.email) {
    return null; // Will redirect via useEffect
  }

  return <LoginForm />;
};

export default LoginPage;