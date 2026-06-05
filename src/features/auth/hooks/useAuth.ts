import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, USER_KEY } from "../utils";
import { IUser } from "../types";

// Usage
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);
  const router = useRouter();

  const checkAuthStatus = async () => {
    try {
      const user = getStoredToken(USER_KEY)
        ? JSON.parse(getStoredToken(USER_KEY)!)
        : null;
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (user) {
        setIsAuthenticated(true);
        setUser(user);
      } else {
        // Server session invalid, clear localStorage
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const authLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
    router.push("/login");
  };

  const onLogin = () => {
    setIsAuthenticated(true);
  };

  return {
    user,
    isAuthenticated,
    loading,
    authLogout,
    onLogin,
    checkAuthStatus,
  };
}
