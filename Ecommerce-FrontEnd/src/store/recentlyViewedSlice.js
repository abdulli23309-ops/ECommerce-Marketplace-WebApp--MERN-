import { createSlice } from "@reduxjs/toolkit";

const getInitialRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState: { items: getInitialRecentlyViewed() },
  reducers: {
    addRecentlyViewed: (state, action) => {
      const product = action.payload;
      if (!product || !product.id) return;

      const items = state.items.filter((item) => item.id !== product.id);
      items.unshift({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });

      state.items = items.slice(0, 10);

      try {
        localStorage.setItem("recentlyViewed", JSON.stringify(state.items));
      } catch {
        // storage unavailable; keep in-memory only
      }
    },
  },
});

export const { addRecentlyViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;