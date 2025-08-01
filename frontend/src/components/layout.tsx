import * as React from "react";
import { appContext } from "../hooks/provider";
import { useConfigStore } from "../hooks/store";
import "antd/dist/reset.css";
import { ConfigProvider, theme } from "antd";
import { SessionManager } from "./views/manager";
import AuthGuard from "./auth/AuthGuard";
import UserProfile from "./auth/UserProfile";

const classNames = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

type Props = {
  title: string;
  link: string;
  children?: React.ReactNode;
  showHeader?: boolean;
  restricted?: boolean;
  meta?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

const MagenticUILayout = ({
  meta,
  title,
  link,
  showHeader = true,
  restricted = false,
  activeTab,
  onTabChange,
}: Props) => {
  const { darkMode, user, setUser } = React.useContext(appContext);
  const { sidebar } = useConfigStore();
  const { isExpanded } = sidebar;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Remove the auto-login effect - let AuthGuard handle authentication

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [link]);

  React.useEffect(() => {
    document.getElementsByTagName("html")[0].className = `${
      darkMode === "dark" ? "dark bg-primary" : "light bg-primary"
    }`;
  }, [darkMode]);

  const layoutContent = (
    <div className="h-screen flex">
      {/* Header with user profile */}
      {/* <div className="absolute top-4 right-4 z-50 max-w-xs">
        <UserProfile />
      </div> */}
      
      {/* Content area */}
      <div
        className={classNames(
          "flex-1 flex flex-col min-h-screen",
          "transition-all duration-300 ease-in-out",
          "md:pl-1",
          isExpanded ? "md:pl-1" : "md:pl-1"
        )}
      >
        <ConfigProvider
          theme={{
            token: {
              borderRadius: 4,
              colorBgBase: darkMode === "dark" ? "#2a2a2a" : "#ffffff",
            },
            algorithm:
              darkMode === "dark"
                ? theme.darkAlgorithm
                : theme.defaultAlgorithm,
          }}
        >
          <main className="flex-1 p-1 text-primary" style={{ height: "100%" }}>
            <SessionManager />
          </main>
        </ConfigProvider>
        <div className="text-sm text-primary mt-2 mb-2 text-center">
          Browser-Agent can make mistakes. Please monitor its work and intervene if
          necessary.
        </div>
      </div>
    </div>
  );

  if (restricted) {
    return (
      <AuthGuard requireAuth={true}>
        {layoutContent}
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      {layoutContent}
    </AuthGuard>
  );
};

export default MagenticUILayout;
