import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProductById, fetchApprovedProducts } from "../../services/productService";
import { fetchProductReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";
import { addItemToCart } from "../../store/cartSlice";
import { addItemToWishlist } from "../../store/wishlistSlice";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Load product details and related products
  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      try {
        const productData = await fetchProductById(productId);
        setProduct(productData);

        if (productData?.images?.length > 0) {
          setMainImage(getImageUrl(productData.images[0]));
        }

        try {
          const allProducts = await fetchApprovedProducts({ page: 1, pageSize: 100 });
          const related = (allProducts?.items || [])
            .filter((p) => p.store === productData.store && p.id !== productId)
            .slice(0, 4);
          setRelatedProducts(related);
        } catch (error) {
          console.error("Failed to fetch related products:", error);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("Failed to load product details:", error);
        setProduct(null);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    loadProductData();
  }, [productId]);

  // Reset reviews page when product changes
  useEffect(() => {
    setReviewsPage(1);
  }, [productId]);

  // Load paginated reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!productId) return;

      try {
        const reviewRes = await fetchProductReviews(productId, {
          page: reviewsPage,
          pageSize: 5,
        });
        setReviews(reviewRes.items || reviewRes || []);
        setTotalReviewPages(reviewRes.totalPages || 1);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setReviews([]);
        setTotalReviewPages(1);
      }
    };

    loadReviews();
  }, [productId, reviewsPage]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAddingToCart(true);
    setMessage({ text: "", type: "" });
    try {
      await dispatch(addItemToCart({ productId: product.id, quantity })).unwrap();
      setMessage({ text: "Item added to cart.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Cart error:", error);
      setMessage({ text: "Could not add to cart. Please try again.", type: "error" });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await dispatch(addItemToWishlist(product.id)).unwrap();
      setMessage({ text: "Item added to wishlist.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Wishlist error:", error);
      setMessage({ text: "Could not add to wishlist. Please try again.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-primary)" }}>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-primary)" }}>
        <h2>Product not found</h2>
        <p>This item may have been removed or is currently unavailable.</p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            cursor: "pointer",
            background: "var(--primary)",
            color: "var(--primary-contrast)",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* --- Image Gallery --- */}
        <div className="product-detail-gallery">
          <div className="product-detail-main-image">
            {mainImage ? (
              <img src={mainImage} alt={product.name} />
            ) : (
              <div
                className="no-image"
                style={{
                  background: "var(--border)",
                  height: "400px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>No Image</span>
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div
              className="product-detail-thumbnails"
              style={{ display: "flex", gap: "1rem", marginTop: "1rem", overflowX: "auto" }}
            >
              {product.images.map((img, index) => (
                <img
                  key={index}
                  src={getImageUrl(img)}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  onClick={() => setMainImage(getImageUrl(img))}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border: mainImage === getImageUrl(img) ? "2px solid var(--primary)" : "1px solid var(--border)",
                    opacity: mainImage === getImageUrl(img) ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- Product Info & Actions --- */}
        <div className="product-detail-info">
          <h1 className="product-detail-name" style={{ margin: "0 0 0.5rem 0" }}>
            {product.name}
          </h1>
          <p
            className="product-detail-price"
            style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}
          >
            PKR {product.price?.toLocaleString()}
          </p>

          <div
            className="product-meta"
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {product.brand?.name && (
              <span>
                <strong>Brand:</strong> {product.brand.name}
              </span>
            )}
            {product.category?.name && (
              <span>
                <strong>Category:</strong> {product.category.name}
              </span>
            )}
          </div>

          {/* Store Card */}
          <div
            className="store-info-card"
            style={{
              marginTop: "1.5rem",
              marginBottom: "2rem",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              background: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {product.store?.logo ? (
                <img
                  src={getImageUrl(product.store.logo)}
                  alt={product.store?.name || "Store"}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "0.25rem",
                    border: "1px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "var(--surface-hover)",
                    borderRadius: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No logo
                </div>
              )}
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {product.store?.name || "Unknown Store"}
                </p>
                {product.store?.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
                    {product.store.description.length > 60
                      ? product.store.description.slice(0, 60) + "..."
                      : product.store.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="product-detail-description" style={{ lineHeight: "1.6", marginBottom: "2rem" }}>
            {product.description || "No description available for this product."}
          </p>

          {/* Cart Controls */}
          {product.stock === 0 ? (
            <p
              className="out-of-stock"
              style={{
                color: "var(--text-primary)",
                fontWeight: "bold",
                padding: "1rem",
                border: "1px solid var(--primary)",
                textAlign: "center",
              }}
            >
              Currently Out of Stock
            </p>
          ) : (
            <div className="add-to-cart-row" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="quantity-control" style={{ display: "flex", border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderLeft: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => Math.min(prev + 1, product.stock))}
                  disabled={quantity >= product.stock}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "none",
                    border: "none",
                    cursor: quantity >= product.stock ? "not-allowed" : "pointer",
                    fontSize: "1.2rem",
                    opacity: quantity >= product.stock ? 0.5 : 1,
                  }}
                >
                  +
                </button>
              </div>
              <button
                className="btn-add-to-cart"
                onClick={handleAddToCart}
                disabled={addingToCart}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  background: "var(--primary)",
                  color: "var(--primary-contrast)",
                  border: "none",
                  cursor: addingToCart ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={handleAddToWishlist}
                style={{
                  marginLeft: "0.5rem",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                title="Add to Wishlist"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Wishlist
              </button>
            </div>
          )}

          {/* Feedback Message */}
          {message.text && (
            <p
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                border: `1px solid ${message.type === "success" ? "var(--success)" : "var(--danger)"}`,
                backgroundColor: message.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
                color: message.type === "success" ? "var(--success-text)" : "var(--danger-text)",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* --- Reviews Section --- */}
      <div className="reviews-section">
        <h2 className="section-title">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
            No reviews have been left for this product yet.
          </p>
        ) : (
          <>
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id || review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-rating">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <p className="review-author">— {review.customer?.name || "Anonymous"}</p>
                </div>
              ))}
            </div>

            {totalReviewPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  className="page-btn"
                  disabled={reviewsPage <= 1}
                  onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <span
                  style={{
                    alignSelf: "center",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Page {reviewsPage} of {totalReviewPages}
                </span>
                <button
                  className="page-btn"
                  disabled={reviewsPage >= totalReviewPages}
                  onClick={() => setReviewsPage((prev) => Math.min(totalReviewPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Related Products Section --- */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title">More from {product.store?.name || "this store"}</h2>
          <div
            className="product-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "2rem",
            }}
          >
            {relatedProducts.map((rp) => (
              <Link
                to={`/products/${rp.id}`}
                key={rp.id}
                className="product-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="product-image">
                  {rp.images?.length > 0 ? (
                    <img src={getImageUrl(rp.images[0])} alt={rp.name} />
                  ) : (
                    <div
                      style={{
                        background: "var(--border)",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>
                <div className="product-details" style={{ paddingTop: "1rem" }}>
                  <p className="product-name" style={{ fontWeight: "bold", margin: "0 0 0.25rem 0" }}>
                    {rp.name}
                  </p>
                  <p className="product-price" style={{ color: "var(--text-primary)", margin: 0 }}>
                    PKR {rp.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;