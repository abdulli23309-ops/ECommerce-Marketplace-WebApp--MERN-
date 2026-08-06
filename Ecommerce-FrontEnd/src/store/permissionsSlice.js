import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../services/axiosInstance";

export const fetchPermissions = createAsyncThunk(
  "permissions/fetchPermissions",
  async () => {
    const response = await axiosInstance.get("/account/permissions");
    // The backend now returns { success, message, data: { roles, permissions } }
    const data = response.data?.data;
    return data?.permissions || [];   // safely extract the permissions array
  }
);

const permissionsSlice = createSlice({
  name: "permissions",
  initialState: {
    codes: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPermissions: (state) => {
      state.codes = [];
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.codes = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;