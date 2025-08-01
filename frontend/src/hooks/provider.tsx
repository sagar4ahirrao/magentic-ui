import React, { useState } from "react";
import { getLocalStorage, setLocalStorage } from "../components/utils";
import { message } from "antd";

export interface IUser {
  name: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  metadata?: any;
}

export interface AppContextType {
  user: IUser | null;
  setUser: any;
  logout: any;
  cookie_name: string;
  darkMode: string;
  setDarkMode: any;
}

const cookie_name = "coral_app_cookie_";

export const appContext = React.createContext<AppContextType>(
  {} as AppContextType
);
const Provider = ({ children }: any) => {
  const storedValue = getLocalStorage("darkmode", false);
  const [darkMode, setDarkMode] = useState(
    storedValue === null ? "dark" : storedValue === "dark" ? "dark" : "light"
  );

  const logout = () => {
    setUserState(null);
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_data");
    message.success("Logged out successfully");
  };

  const updateDarkMode = (darkMode: string) => {
    setDarkMode(darkMode);
    setLocalStorage("darkmode", darkMode, false);
  };

  // Initialize user from localStorage or set to null for authentication
  const storedUserData = getLocalStorage("user_data", true);
  const initUser = storedUserData || null;

  const setUser = (user: IUser | null) => {
    if (user?.email) {
      setLocalStorage("user_email", user.email, false);
      setLocalStorage("user_data", user, true);
    }
    setUserState(user);
  };

  const [userState, setUserState] = useState<IUser | null>(initUser);

  React.useEffect(() => {
    const storedUserData = getLocalStorage("user_data", true);
    if (storedUserData) {
      setUserState(storedUserData);
    }
  }, []);

  return (
    <appContext.Provider
      value={{
        user: userState,
        setUser,
        logout,
        cookie_name,
        darkMode,
        setDarkMode: updateDarkMode,
      }}
    >
      {children}
    </appContext.Provider>
  );
};

export default ({ element }: any) => <Provider>{element}</Provider>;
