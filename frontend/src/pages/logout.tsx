import * as React from "react";
import { appContext } from "../hooks/provider";
import { Spin, message } from "antd";

const LogoutPage = () => {
  const { logout } = React.useContext(appContext);
  const [isLoggingOut, setIsLoggingOut] = React.useState(true);

  React.useEffect(() => {
    const performLogout = async () => {
      try {
        logout();
        message.success("Logged out successfully");
      } catch (error) {
        message.error("Error during logout");
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [logout]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">Logging out...</div>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    window.location.href = "/login";
  }, []);
  
  return null;
};

export default LogoutPage;