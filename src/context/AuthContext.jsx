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
  // True until the initial getMe() call resolves — PrivateRoute uses this
  // to avoid bouncing a logged-in user to /login just because the token
  // check hasn't come back yet.
  const [initializing, setInitializing] = useState(true);

useEffect(() => {
  getMe()
    .then((data) => setUser(data.user))
    .catch(() => setUser(null))
    .finally(() => setInitializing(false));
}, []);




  async function login(email, password) {
    await apiLogin(email, password);     // calls /auth/login
    const me = await getMe();            // calls /auth/me

    setUser(me.user);
    return me.user;
  }

  // Re-hydrates `user` from whatever token is already in localStorage,
  // without going through email/password login. Needed after signup flows
  // that leave the registration token active (e.g. receptionists, whose
  // completeProfile() never revokes the token or gates them on approval)
  // so PrivateRoute sees a logged-in user right away.
  async function refreshUser() {
    const me = await getMe();
    setUser(me.user);
    return me.user;
  }



async function logout() {
  await apiLogout();     // calls /auth/logout
  setUser(null);
}


  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
