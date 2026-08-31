import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { addRecentlyViewed } from "../../store/recentlyViewedSlice";
import { useSelector, useDispatch } from "react-redux";
import { fetchProductById, fetchApprovedProducts } from "../../services/productService";
import { fetchProductReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageHelper";
import { addItemToCart } from "../../store/cartSlice";
import { addItemToWishlist } from "../../store/wishlistSlice";
import axiosInstance from "../../services/axiosInstance";
import FreeDeliveryBadge from "../../components/common/FreeDeliveryBadge";
import { Skeleton } from "../../components/common/Skeleton";
import { toastSuccess, toastError } from "../../components/common/Toast";

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [ownStoreId, setOwnStoreId] = useState(null);

  useEffect(() => {
    if (user?.role === "Seller" || user?.roles?.includes("Seller")) {
      axiosInstance
        .get("/stores/mine")
        .then((res) => {
          if (res.data?.data?._id) {
            setOwnStoreId(res.data.data._id);
          }
        })
        .catch(() => setOwnStoreId(null));
    } else {
      setOwnStoreId(null);
    }
  }, [user]);

  const isOwnProduct =
    ownStoreId && product?.store?._id && ownStoreId === product.store._id;

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);

      try {
        const productData = await fetchProductById(productId);
        setProduct(productData);

        if (productData?.id || productData?._id) {
          dispatch(
            addRecentlyViewed({
              id: productData.id || productData._id,
              name: productData.name,
              price: productData.price,
              image: productData.images?.[0],
            })
          );
        }

        try {
          const storeId =
            typeof productData.store === "object"
              ? productData.store?._id || productData.store?.id
              : productData.store;

          if (storeId) {
            const relatedRes = await fetchApprovedProducts({
              store: storeId,
              page: 1,
              pageSize: 5,
            });

            const related = (relatedRes.items || [])
              .filter(
                (p) =>
                  (p._id || p.id) !== (productData._id || productData.id)
              )
              .slice(0, 4);

            setRelatedProducts(related);
          } else {
            setRelatedProducts([]);
          }
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

  useEffect(() => {
    setReviewsPage(1);
  }, [productId]);

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

    try {
      await dispatch(
        addItemToCart({
          productId: product.id || product._id,
          quantity,
        })
      ).unwrap();

      toastSuccess("Item added to cart.");
    } catch (error) {
      console.error("Cart error:", error);
      toastError("Could not add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const mainButton = document.querySelector(".btn-add-to-cart");
      if (mainButton) {
        const rect = mainButton.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await dispatch(addItemToWishlist(product.id || product._id)).unwrap();
      toastSuccess("Item added to wishlist.");
    } catch (error) {
      console.error("Wishlist error:", error);
      toastError("Could not add to wishlist. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-gallery">
            <div className="product-detail-main-image">
              <Skeleton variant="card" height="400px" />
            </div>
          </div>
          <div className="product-detail-info">
            <Skeleton variant="title" width="60%" />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="40%" />
            <div className="product-meta" style={{ marginBottom: "2rem" }}>
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="50%" />
            </div>
            <div className="store-info-card" style={{ marginBottom: "2rem" }}>
              <Skeleton variant="circle" width="60px" height="60px" />
              <div style={{ flex: 1 }}>
                <Skeleton variant="title" width="80%" />
                <Skeleton variant="text" width="60%" />
              </div>
            </div>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          padding: "4rem",
          textAlign: "center",
          color: "var(--text-primary)",
        }}
      >
        <h2>Currently Unavailable</h2>
        <p>This product is currently unavailable. The seller account may be suspended or the product has been removed.</p>
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

  const mainImage =
    selectedImage ||
    (product?.images?.length > 0 ? getImageUrl(product.images[0]) : "");

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
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
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                overflowX: "auto",
                padding: "4px 0",
              }}
            >
              {product.images.map((img, index) => {
                const isActive = mainImage === getImageUrl(img);
                return (
                  <img
                    key={index}
                    src={getImageUrl(img)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    onClick={() => setSelectedImage(getImageUrl(img))}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      cursor: "pointer",
                      borderRadius: "8px",
                      border: isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
                      opacity: isActive ? 1 : 0.65,
                      boxShadow: isActive ? "0 0 12px color-mix(in srgb, var(--primary) 35%, transparent)" : "none",
                      transition: "all var(--tr-fast)",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <h1
            className="product-detail-name"
            style={{ margin: "0 0 0.5rem 0" }}
          >
            {product.name}
          </h1>

          <p
            className="product-detail-price"
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: "0 0 1rem 0",
            }}
          >
            PKR {product.price?.toLocaleString()}
          </p>

          {product.freeDelivery === true && (
            <FreeDeliveryBadge style={{ marginBottom: "1.25rem" }} />
          )}

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
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {product.store?.name || "Unknown Store"}
                </p>
                {product.store?.description && (
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    {product.store.description.length > 60
                      ? product.store.description.slice(0, 60) + "..."
                      : product.store.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p
            className="product-detail-description"
            style={{ lineHeight: "1.6", marginBottom: "2rem" }}
          >
            {product.description || "No description available for this product."}
          </p>

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
            <div
              className="add-to-cart-row"
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                className="quantity-control"
                style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "var(--surface)" }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                    transition: "background var(--tr-fast)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
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
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((prev) => Math.min(prev + 1, product.stock))
                  }
                  disabled={quantity >= product.stock}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background: "none",
                    border: "none",
                    cursor:
                      quantity >= product.stock ? "not-allowed" : "pointer",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                    opacity: quantity >= product.stock ? 0.5 : 1,
                    transition: "background var(--tr-fast)",
                  }}
                  onMouseEnter={(e) => { if (quantity < product.stock) e.currentTarget.style.background = "var(--surface-hover)"; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  +
                </button>
              </div>

              <button
                className="btn-add-to-cart vv-btn vv-btn--primary"
                onClick={handleAddToCart}
                disabled={addingToCart || isOwnProduct}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                {isOwnProduct
                  ? "Own Product"
                  : addingToCart
                    ? "Adding..."
                    : "Add to Cart"}
              </button>

              <button
                onClick={handleAddToWishlist}
                className="vv-btn vv-btn--secondary"
                style={{
                  marginLeft: "0.5rem",
                  borderRadius: "8px",
                  padding: "0.75rem 1.25rem",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                title="Add to Wishlist"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Wishlist
              </button>
            </div>
          )}

                  </div>
      </div>

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
                <div
                  key={review._id || review.id}
                  className="review-card"
                >
                  <div className="review-header">
                    <span className="review-rating">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", margin: "10px 0", flexWrap: "wrap" }}>
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={getImageUrl(img)}
                          alt="Review attachment"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="review-author">
                    — {review.isAnonymous ? "Anonymous Customer" : (review.customer?.name || "Verified Customer")}
                  </p>
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
                  onClick={() =>
                    setReviewsPage((prev) => Math.max(1, prev - 1))
                  }
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
                  onClick={() =>
                    setReviewsPage((prev) => Math.min(totalReviewPages, prev + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title">
            More from {product.store?.name || "this store"}
          </h2>

          <div
            className="product-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "2rem",
            }}
          >
            {relatedProducts.map((rp) => {
              const relatedPath = `/products/${rp._id || rp.id}`;

              return (
                <Link
                  to={relatedPath}
                  key={rp._id || rp.id}
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

                  <div
                    className="product-details"
                    style={{ paddingTop: "1rem" }}
                  >
                    <p
                      className="product-name"
                      style={{
                        fontWeight: "bold",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      {rp.name}
                    </p>

                    <p
                      className="product-price"
                      style={{
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      PKR {rp.price?.toLocaleString()}
                    </p>

                    {rp.freeDelivery === true && (
                      <FreeDeliveryBadge style={{ marginTop: "0.5rem" }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {showStickyBar && product.stock > 0 && (
        <div className="sticky-action-bar page-fade-slide" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.06)',
          padding: '0.85rem 2rem',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {product.images && product.images.length > 0 && (
              <img src={getImageUrl(product.images[0])} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: "1px solid var(--border)" }} />
            )}
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{product.name}</p>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600 }}>PKR {product.price?.toLocaleString()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || isOwnProduct}
              className="vv-btn vv-btn--primary"
              style={{ padding: '0.6rem 1.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {isOwnProduct ? "Own Product" : addingToCart ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;