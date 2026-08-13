import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout } from "../api/auth";
import { login as apiLogin, getMe } from "../api/auth";
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
  const [user, setUser] = useState(null);

useEffect(() => {
  getMe()
    .then((data) => setUser(data.user))
    .catch(() => setUser(null));
}, []);




  async function login(email, password) {
    await apiLogin(email, password);     // calls /auth/login
    const me = await getMe();            // calls /auth/me

    setUser(me.user);
    return me.user;
  }



async function logout() {
  await apiLogout();     // calls /auth/logout
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
