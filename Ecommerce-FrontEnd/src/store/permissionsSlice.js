import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../services/axiosInstance";

export const fetchPermissions = createAsyncThunk(
  "permissions/fetchPermissions",
  async () => {
    const response = await axiosInstance.get("/account/permissions");
    // response.data = { success, data: [...], message }
    // response.data.data = the permissions array
    return response.data?.data ?? [];
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