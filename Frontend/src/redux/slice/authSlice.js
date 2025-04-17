import { createSlice } from "@reduxjs/toolkit";

// Retrieve token from localStorage (if exists)
const storedToken = localStorage.getItem("token");

const initialState = {
  isAuthenticated: !!storedToken, // Converts to boolean
  token: storedToken || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token); // Store token
      window.dispatchEvent(new Event("authChanged")); // Notify all tabs
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem("token"); // Remove token
      window.dispatchEvent(new Event("authChanged")); // Notify all tabs
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
