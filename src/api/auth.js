import api from "./axios";

// LOGIN
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });

  const token = response.data.data.token;
  localStorage.setItem("token", token);

  return response.data;
};

// GET AUTHENTICATED USER
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

// LOGOUT
export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};


// REGISTER DOCTOR
export const registerDoctor = async (name, email, password, specialization) => {
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
    role: "doctor",
    specialization, // optional, if backend expects it
  });
  return response.data;
};
