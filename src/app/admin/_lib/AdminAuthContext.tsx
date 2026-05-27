"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AdminAuthCtx {
  adminKey: string;
  setAdminKey: (k: string) => void;
  logout: () => void;
  ready: boolean;
}

export const AdminAuthContext = createContext<AdminAuthCtx>({
  adminKey: "",
  setAdminKey: () => {},
  logout: () => {},
  ready: false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKeyState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("alynaf-admin-key") ?? "";
    setAdminKeyState(saved);
    setReady(true);
  }, []);

  function setAdminKey(k: string) {
    setAdminKeyState(k);
    sessionStorage.setItem("alynaf-admin-key", k);
  }

  function logout() {
    setAdminKeyState("");
    sessionStorage.removeItem("alynaf-admin-key");
  }

  return (
    <AdminAuthContext.Provider value={{ adminKey, setAdminKey, logout, ready }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
