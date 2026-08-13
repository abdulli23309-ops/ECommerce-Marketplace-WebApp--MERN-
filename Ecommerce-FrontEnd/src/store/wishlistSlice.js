import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as wishlistService from "../services/wishlistService";

export const loadWishlist = createAsyncThunk(
  "wishlist/loadWishlist",
  async () => {
    return await wishlistService.fetchWishlist();
  }
);

export const addItemToWishlist = createAsyncThunk(
  "wishlist/addItem",
  async (productId) => {
    return await wishlistService.addToWishlist(productId);
  }
);

export const removeItemFromWishlist = createAsyncThunk(
  "wishlist/removeItem",
  async (productId) => {
    return await wishlistService.removeFromWishlist(productId);
  }
);

export const emptyWishlist = createAsyncThunk(
  "wishlist/empty",
  async () => {
    return await wishlistService.clearWishlist();
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    totalCount: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWishlist.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(loadWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addItemToWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(addItemToWishlist.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(removeItemFromWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(removeItemFromWishlist.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(emptyWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(emptyWishlist.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export default wishlistSlice.reducer;