import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const MOCK_USERS = {
  "doctor@medcenter.com": { name: "Dr. Ahmad", role: "doctor", initials: "DA" },
  "reception@medcenter.com": {
    name: "Sarah Jenkins",
    role: "receptionist",
    initials: "SJ",
  },
  "admin@medcenter.com": {
    name: "Super Admin",
    role: "admin",
    initials: "SA",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("mc_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    // TODO: replace with real API call
    const found = MOCK_USERS[email.toLowerCase()];
    if (!found || password.length < 4)
      throw new Error("Invalid email or password.");
    const userData = { ...found, email };
    sessionStorage.setItem("mc_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  function logout() {
    sessionStorage.removeItem("mc_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
