import { createSlice } from "@reduxjs/toolkit";

const getInitialActiveDashboard = (actualRoles) => {
  if (!actualRoles || actualRoles.length === 0) return "customer";

  if (actualRoles.includes("Admin") || actualRoles.includes("SuperAdmin")) {
    return "admin";
  }

  if (actualRoles.includes("Seller")) {
    return "seller";
  }

  return "customer";
};

const dashboardContextSlice = createSlice({
  name: "dashboardContext",
  initialState: {
    actualRole: null,
    activeDashboard: "customer",
  },
  reducers: {
    setActualRole: (state, action) => {
      state.actualRole = action.payload;
    },
    setActiveDashboard: (state, action) => {
      state.activeDashboard = action.payload;
    },
    resetDashboardContext: (state) => {
      state.actualRole = null;
      state.activeDashboard = "customer";
    },
  },
});

export const {
  setActualRole,
  setActiveDashboard,
  resetDashboardContext,
} = dashboardContextSlice.actions;

export default dashboardContextSlice.reducer;