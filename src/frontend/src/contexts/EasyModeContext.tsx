import { createContext, useContext, useEffect, useState } from "react";

interface EasyModeContextValue {
  easyMode: boolean;
  toggleEasyMode: () => void;
}

const EasyModeContext = createContext<EasyModeContextValue>({
  easyMode: false,
  toggleEasyMode: () => {},
});

export function EasyModeProvider({ children }: { children: React.ReactNode }) {
  const [easyMode, setEasyMode] = useState(() => {
    return localStorage.getItem("metalscanner_easymode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("metalscanner_easymode", easyMode ? "true" : "false");
    if (easyMode) {
      document.documentElement.classList.add("easy-mode");
    } else {
      document.documentElement.classList.remove("easy-mode");
    }
  }, [easyMode]);

  const toggleEasyMode = () => setEasyMode((prev) => !prev);

  return (
    <EasyModeContext.Provider value={{ easyMode, toggleEasyMode }}>
      {children}
    </EasyModeContext.Provider>
  );
}

export function useEasyMode() {
  return useContext(EasyModeContext);
}
