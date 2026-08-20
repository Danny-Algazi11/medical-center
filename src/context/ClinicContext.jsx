import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

// Only doctors work at more than one clinic — a receptionist's clinic is
// fixed (one entry, no real "choice"). This context is effectively inert
// for every other role: clinics comes back empty and nothing renders.
const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const { user } = useAuth();
  const role = user?.role;
  const clinics = role === "doctor" ? user?.profile?.clinics || [] : [];
  const clinicIds = clinics.map((c) => c.clinic_id).join(",");
  const storageKey = user ? `selectedClinicId:${user.id}` : null;

  const [selectedClinicId, setSelectedClinicIdState] = useState(null);

  // (Re)pick a valid clinic whenever the user or their clinic list changes:
  // restore the last choice from localStorage if it's still valid for this
  // user, otherwise default to their first clinic.
  useEffect(() => {
    if (!clinics.length) {
      setSelectedClinicIdState(null);
      return;
    }
    const validIds = clinics.map((c) => c.clinic_id);
    const stored = storageKey ? Number(localStorage.getItem(storageKey)) : null;
    setSelectedClinicIdState(
      stored && validIds.includes(stored) ? stored : clinics[0].clinic_id,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, clinicIds]);

  function setSelectedClinicId(id) {
    setSelectedClinicIdState(id);
    if (storageKey) localStorage.setItem(storageKey, String(id));
  }

  const selectedClinic =
    clinics.find((c) => c.clinic_id === selectedClinicId) || null;

  return (
    <ClinicContext.Provider
      value={{ clinics, selectedClinicId, selectedClinic, setSelectedClinicId }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }
  return ctx;
}
