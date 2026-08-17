import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // Browser storage or media queries may be unavailable during rendering.
  }
  return "light";
};

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: getInitialTheme() },
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload === "dark" ? "dark" : "light";
      localStorage.setItem("theme", state.mode);
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.mode);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
