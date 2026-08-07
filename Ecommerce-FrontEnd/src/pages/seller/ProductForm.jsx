import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCategories, fetchSubCategories } from "../../services/categoryService";
import { fetchBrands } from "../../services/brandService";
import {
  createProduct,
  updateProduct,
  fetchSellerProducts,
} from "../../services/sellerProductService";
import { getImageUrl } from "../../utils/imageHelper";

const ProductFormModal = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState(null);
  const selectedCategoryId = watch("category");

  // Image state
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [imageError, setImageError] = useState(null);

  const maxTotalImages = 5;

  // Load categories & brands, and if editing, find the product and its subcategories
  useEffect(() => {
    const load = async () => {
      const [cats, br] = await Promise.all([fetchCategories(), fetchBrands()]);
      setCategories(cats);
      setBrands(br);

      if (isEdit) {
        try {
          const res = await fetchSellerProducts({ pageSize: 100 });
          const products = res.items || [];
          const product = products.find((p) => p._id === id || p.id === id);

          if (product) {
            const catId = product.categoryId || product.category;
            // First load subcategories for this product's category
            if (catId) {
              const subs = await fetchSubCategories(catId);
              setSubCategories(subs);
            }

            // Now set all form fields – subcategories are already available
            setValue("name", product.name || "");
            setValue("description", product.description || "");
            setValue("price", product.price || product.basePrice || "");
            setValue("stock", product.stock || product.stockQuantity || 0);
            setValue("category", catId || "");
            setValue(
              "subCategory",
              product.subCategoryId || product.subCategory || ""
            );
            setValue("brand", product.brandId || product.brand || "");

            if (product.images?.length > 0) {
              setExistingImages(product.images);
            }
          }
        } catch (err) {
          console.error("Failed to load product for editing", err);
        }
      }
    };
    load();
  }, [id, isEdit, setValue]);

  // When selected category changes (e.g., user picks a different category in the form),
  // reload subcategories and reset the subcategory field
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubCategories(selectedCategoryId)
        .then((data) => {
          setSubCategories(data);
          // Only reset subcategory if the current value isn't in the new list
          const currentSub = watch("subCategory");
          if (currentSub && !data.some((s) => s.id === currentSub)) {
            setValue("subCategory", "");
          }
        })
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
      setValue("subCategory", "");
    }
  }, [selectedCategoryId]);

  // Remove an existing image
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

  // Handle new file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalAfterAdd = existingImages.length + newFiles.length + files.length;

    if (totalAfterAdd > maxTotalImages) {
      setImageError(
        `Maximum ${maxTotalImages} images allowed. You already have ${
          existingImages.length + newFiles.length
        }.`
      );
      e.target.value = "";
      return;
    }

    setImageError(null);
    setNewFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  // Remove a new file before upload
  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImageError(null);
  };

  // Submit
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", parseFloat(data.price));
      formData.append("stock", parseInt(data.stock) || 0);
      formData.append("category", data.category);
      formData.append("subCategory", data.subCategory);
      if (data.brand) formData.append("brand", data.brand);

      // Append kept existing images (as paths)
      if (existingImages.length > 0) {
        existingImages.forEach((img) => formData.append("existingImages", img));
      }

      // Append new images
      if (newFiles.length > 0) {
        newFiles.forEach((file) => formData.append("images", file));
      }

      if (isEdit) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }

      navigate("/seller/products");
    } catch (err) {
      console.error("Failed to save product", err);
      const status = err.response?.status;
      if (status === 409) {
        setError("A product with this name already exists in your store.");
      } else if (status === 400) {
        const backendErrors = err.response?.data?.errors;
        if (backendErrors?.length) setError(backendErrors[0].message);
        else setError("Validation failed. Please check your inputs.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => navigate("/seller/products")}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "640px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "2rem",
          boxSizing: "border-box",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#111827",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={() => navigate("/seller/products")}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 2-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Name – full width */}
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                {...register("name", { required: true })}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {/* Description – full width */}
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                {...register("description")}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {/* Price & Stock side-by-side */}
            <div className="form-group">
              <label className="form-label">Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                {...register("price", { required: true, min: 0.01 })}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Qty</label>
              <input
                type="number"
                className="form-input"
                {...register("stock", { required: true, valueAsNumber: true, min: 0 })}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {/* Category & Subcategory */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                {...register("category", { required: true })}
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select
                className="form-input"
                {...register("subCategory", { required: true })}
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Select</option>
                {subCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand – full width */}
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Brand</label>
              <select
                className="form-input"
                {...register("brand")}
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Select</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">
              Product Images ({existingImages.length + newFiles.length}/{maxTotalImages})
            </label>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {existingImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                    }}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Existing ${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "0.25rem",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Previews */}
            {newPreviews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {newPreviews.map((preview, idx) => (
                  <div
                    key={`new-${idx}`}
                    style={{ position: "relative", width: "80px", height: "80px" }}
                  >
                    <img
                      src={preview}
                      alt={`New ${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "0.25rem",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {existingImages.length + newFiles.length < maxTotalImages && (
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
            )}

            {imageError && (
              <p style={{ color: "#d11a2a", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                {imageError}
              </p>
            )}
          </div>

          {/* Error / Submit */}
          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ProductFormModal;