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
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      subCategory: "",
      brand: "",
      freeDelivery: false, // <-- added default
    },
  });
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
            if (catId) {
              const subs = await fetchSubCategories(catId);
              setSubCategories(subs);
            }

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
            setValue("freeDelivery", product.freeDelivery ?? false); // <-- load freeDelivery

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

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubCategories(selectedCategoryId)
        .then((data) => {
          setSubCategories(data);
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

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

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

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImageError(null);
  };

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
      // Append freeDelivery as boolean string
      formData.append("freeDelivery", data.freeDelivery ? "true" : "false"); // <-- added

      if (existingImages.length > 0) {
        existingImages.forEach((img) => formData.append("existingImages", img));
      }

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
      <div
        onClick={() => navigate("/seller/products")}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

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
          background: "var(--surface)",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "2rem",
          boxSizing: "border-box",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "var(--text-primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={() => navigate("/seller/products")}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                {...register("name", { required: true })}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                {...register("description")}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

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

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">
              Product Images ({existingImages.length + newFiles.length}/{maxTotalImages})
            </label>

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
                        border: "1px solid var(--border)",
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
                        border: "1px solid var(--border)",
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

            {existingImages.length + newFiles.length < maxTotalImages && (
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
            )}

            {imageError && (
              <p style={{ color: "var(--danger-text)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                {imageError}
              </p>
            )}
          </div>

          {/* ---------- Free Delivery Toggle ---------- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="checkbox"
              id="freeDelivery"
              {...register("freeDelivery")}
            />
            <label htmlFor="freeDelivery" className="form-label" style={{ margin: 0 }}>
              Free Delivery
            </label>
          </div>

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