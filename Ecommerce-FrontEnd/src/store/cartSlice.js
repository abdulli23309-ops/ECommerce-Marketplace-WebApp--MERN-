import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../services/axiosInstance";

export const loadCart = createAsyncThunk("cart/loadCart", async () => {
  const { data } = await axiosInstance.get("/cart");
  return data.data; // cart object
});

export const addItemToCart = createAsyncThunk("cart/addItem", async ({ productId, quantity }) => {
  const { data } = await axiosInstance.post("/cart/items", { productId, quantity });
  return data.data; // updated cart
});

export const updateQuantity = createAsyncThunk("cart/updateQuantity", async ({ productId, quantity }) => {
  const { data } = await axiosInstance.put("/cart/items", { productId, quantity });
  return data.data;
});

export const removeFromCart = createAsyncThunk("cart/removeFromCart", async (productId) => {
  const { data } = await axiosInstance.delete("/cart/items", { data: { productId } });
  return data.data;
});

export const emptyCart = createAsyncThunk("cart/emptyCart", async () => {
  const { data } = await axiosInstance.delete("/cart");
  return data.data;
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