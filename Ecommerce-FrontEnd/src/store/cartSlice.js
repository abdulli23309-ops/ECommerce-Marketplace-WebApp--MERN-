import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as clearCartService,
} from "../services/cartService";

export const loadCart = createAsyncThunk("cart/loadCart", async () => {
  return await fetchCart();            // returns transformed cart with unitPrice
});

export const addItemToCart = createAsyncThunk("cart/addItem", async ({ productId, quantity }) => {
  return await addToCart(productId, quantity);
});

export const updateQuantity = createAsyncThunk("cart/updateQuantity", async ({ productId, quantity }) => {
  return await updateCartItemQuantity(productId, quantity);
});

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (productId) => {
  return await removeCartItem(productId);
});

export const emptyCart = createAsyncThunk("cart/emptyCart", async () => {
  return await clearCartService();
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    totalCount: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
        state.status = "succeeded";
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
      })
      .addCase(emptyCart.fulfilled, (state, action) => {
        state.items = [];
        state.totalCount = 0;
      });
  },
});

export default cartSlice.reducer;