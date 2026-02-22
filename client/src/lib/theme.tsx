import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children, initialTheme = "light" }: { children: ReactNode; initialTheme?: string }) {
  const [theme, setTheme] = useState(initialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
