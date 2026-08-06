import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import permissionsReducer from "./permissionsSlice";
import cartReducer from "./cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    permissions: permissionsReducer,
  },
});