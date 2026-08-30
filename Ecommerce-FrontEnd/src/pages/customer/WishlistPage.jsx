import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  loadWishlist,
  removeItemFromWishlist,
  emptyWishlist,
} from "../../store/wishlistSlice";
import { addItemToCart } from "../../store/cartSlice";
import { getImageUrl } from "../../utils/imageHelper";
import { toastSuccess, toastError } from "../../components/common/Toast";

const HeartIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CartIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
    />
  </svg>
);

const EmptyHeart = () => (
  <svg width="72" height="72" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items, status, totalCount } = useSelector((state) => state.wishlist);
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    dispatch(loadWishlist());
  }, [dispatch]);

  const handleRemove = (productId) => {
    dispatch(removeItemFromWishlist(productId));
  };

  const handleClear = () => {
    dispatch(emptyWishlist());
  };

  const handleAddToCart = async (productId) => {
    setAddingProductId(productId);
    try {
      await dispatch(addItemToCart({ productId, quantity: 1 })).unwrap();
      toastSuccess("Moved to cart");
    } catch (error) {
      console.error("Failed to add item to cart", error);
      toastError("Could not add to cart. Please try again.");
    } finally {
      setAddingProductId(null);
    }
  };

  if (status === "loading") {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>My Wishlist</h1>
          <p style={styles.pageSubtitle}>
            {totalCount > 0
              ? `${totalCount} saved ${totalCount === 1 ? "item" : "items"}`
              : "Save your favourite products for later"}
          </p>
        </div>

        {items.length > 0 && (
          <button onClick={handleClear} style={styles.clearButton}>
            <TrashIcon />
            Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIconWrapper}>
            <EmptyHeart />
          </div>
          <h2 style={styles.emptyTitle}>Your wishlist is empty</h2>
          <p style={styles.emptyText}>
            Discover products you love and tap the heart icon to save them here.
          </p>
          <Link to="/products" style={styles.shopButton}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={styles.productGrid}>
          {items.map((item) => (
            <div key={item.productId} style={styles.productCard}>
              <Link
                to={`/products/${item.productId}`}
                style={styles.productImageLink}
              >
                <div style={styles.productImageWrapper}>
                  {item.productImage ? (
                    <img
                      src={getImageUrl(item.productImage)}
                      alt={item.productName}
                      style={styles.productImage}
                    />
                  ) : (
                    <div style={styles.noImage}>
                      <HeartIcon />
                    </div>
                  )}
                </div>
              </Link>

              <div style={styles.productInfo}>
                <Link
                  to={`/products/${item.productId}`}
                  style={styles.productName}
                >
                  {item.productName}
                </Link>
                <div style={styles.productPrice}>
                  PKR {item.price.toLocaleString()}
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleAddToCart(item.productId)}
                    disabled={addingProductId === item.productId}
                    style={{
                      ...styles.addToCartButton,
                      opacity: addingProductId === item.productId ? 0.7 : 1,
                    }}
                  >
                    <CartIcon />
                    {addingProductId === item.productId
                      ? "Adding..."
                      : "Add to Cart"}
                  </button>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    style={styles.removeButton}
                    title="Remove from wishlist"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2.5rem 1.5rem",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "var(--text-primary)",
  },
  loadingContainer: {
    padding: "4rem 1rem",
    textAlign: "center",
    color: "var(--text-secondary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "#111827",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1.5rem",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    margin: 0,
    color: "var(--text-primary)",
  },
  pageSubtitle: {
    margin: "0.25rem 0 0",
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
  },
  clearButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.55rem 1.1rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "1.5rem",
  },
  productCard: {
    background: "var(--surface)",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    overflow: "hidden",
    transition: "box-shadow 0.25s, transform 0.25s",
    boxShadow: "0 1px 2px var(--shadow)",
  },
  productImageLink: {
    display: "block",
    textDecoration: "none",
  },
  productImageWrapper: {
    width: "100%",
    height: "200px",
    backgroundColor: "var(--bg-secondary)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noImage: {
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: "1rem",
  },
  productName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    textDecoration: "none",
    display: "block",
    lineHeight: 1.4,
    marginBottom: "0.25rem",
  },
  productPrice: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--info)",
    marginBottom: "1rem",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  addToCartButton: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.55rem 0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "var(--primary)",
    color: "var(--primary-contrast)",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  removeButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    border: "1px solid #fee2e2",
    background: "var(--danger-bg)",
    color: "var(--danger)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 1rem",
    background: "var(--surface)",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    boxShadow: "0 1px 2px var(--shadow)",
  },
  emptyIconWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "0 0 0.5rem",
  },
  emptyText: {
    color: "var(--text-secondary)",
    margin: "0 0 1.5rem",
  },
  shopButton: {
    display: "inline-block",
    padding: "0.7rem 1.5rem",
    borderRadius: "8px",
    background: "var(--primary)",
    color: "var(--primary-contrast)",
    fontWeight: 600,
    fontSize: "0.9rem",
    textDecoration: "none",
  },
};

export default WishlistPage;
