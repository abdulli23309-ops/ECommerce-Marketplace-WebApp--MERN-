import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import permissionsReducer from "./permissionsSlice";
import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice";
import dashboardContextReducer from "./dashboardContextSlice";
import themeReducer from "./themeSlice";
import recentlyViewedReducer from "./recentlyViewedSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    permissions: permissionsReducer,
    wishlist: wishlistReducer,
    theme: themeReducer,
    recentlyViewed: recentlyViewedReducer,
    dashboardContext: dashboardContextReducer,
  },
});