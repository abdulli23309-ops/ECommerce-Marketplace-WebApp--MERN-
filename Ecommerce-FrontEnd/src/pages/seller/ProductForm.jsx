import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCategories, fetchSubCategories } from "../../services/categoryService";
import { fetchBrands } from "../../services/brandService";
import {
  createProduct,
  updateProduct,
  fetchSellerProducts,
  uploadProductImage,
} from "../../services/sellerProductService";

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState(null);
  const selectedCategoryId = watch("category");

  // Image states
  const [newFiles, setNewFiles] = useState([]);       // File objects selected for upload
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Load categories and brands on mount
  useEffect(() => {
    const loadFormData = async () => {
      const [cats, br] = await Promise.all([fetchCategories(), fetchBrands()]);
      setCategories(cats);
      setBrands(br);

      if (isEdit) {
        const products = await fetchSellerProducts();
        const product = products.find(p => p.id === id);
        if (product) {
          setValue("name", product.name);
          setValue("description", product.description);
          setValue("price", product.basePrice);
          setValue("stock", product.stockQuantity);
          setValue("category", product.category);
          setValue("subCategory", product.subCategory);
          setValue("brand", product.brand || "");
        }
      }
    };
    loadFormData();
  }, [id, isEdit, setValue]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubCategories(selectedCategoryId)
        .then(data => setSubCategories(data))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
    }
  }, [selectedCategoryId]);

 const onSubmit = async (data) => {
  setLoading(true);
  setError(null); // add a state for error display: const [error, setError] = useState(null);
  try {
    const payload = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      stock: parseInt(data.stock) || 0,
      category: data.category,
      subCategory: data.subCategory,
      brand: data.brand || null,
    };

    let productId = id;
    if (isEdit) {
      await updateProduct(productId, payload);
    } else {
      const newProduct = await createProduct(payload);
      productId = newProduct.id;
    }

    // Upload any selected new files
    if (newFiles.length > 0 && productId) {
      setUploading(true);
      for (const file of newFiles) {
        await uploadProductImage(productId, file);
      }
      setUploading(false);
    }

    // Show success message briefly before navigating away
    setError({ type: "success", text: "Product saved successfully!" });
    setTimeout(() => {
      navigate("/seller/products");
    }, 1500);
  } catch (err) {
    console.error("Failed to save product", err);
    const status = err.response?.status;
    if (status === 409) {
      setError({ type: "error", text: "A product with this name already exists in your store." });
    } else if (status === 400) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && backendErrors.length > 0) {
        setError({ type: "error", text: backendErrors[0].message });
      } else {
        setError({ type: "error", text: "Validation failed. Please check your inputs." });
      }
    } else {
      setError({ type: "error", text: "Something went wrong. Please try again." });
    }
    setLoading(false);
    setUploading(false);
  }
};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(files);
    setImageError(null);
  };

  return (
    <div>
      <h2 className="section-title">{isEdit ? "Edit Product" : "Add Product"}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="form-container" style={{ maxWidth: "600px" }}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" {...register("name", { required: true })} /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows="4" {...register("description")} /></div>
        <div className="form-group"><label className="form-label">Price (PKR)</label><input type="number" step="0.01" className="form-input" {...register("price", { required: true, min: 0.01 })} /></div>
        <div className="form-group"><label className="form-label">Stock Quantity</label><input type="number" className="form-input" {...register("stock", { required: true, valueAsNumber: true, min: 0 })} /></div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" {...register("category", { required: true })} defaultValue="">
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">SubCategory</label>
          <select className="form-input" {...register("subCategory", { required: true })} defaultValue="">
            <option value="">Select SubCategory</option>
            {subCategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Brand</label>
          <select className="form-input" {...register("brand")} defaultValue="">
            <option value="">Select Brand</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* New Image Upload */}
        <div className="form-group">
          <label className="form-label">Product Images</label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
          {newFiles.length > 0 && (
            <div className="new-files-preview" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {newFiles.map((file, index) => (
                <div key={index} style={{ textAlign: "center" }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid #eaeaea" }}
                  />
                  <span style={{ fontSize: "0.7rem", display: "block" }}>{file.name}</span>
                </div>
              ))}
            </div>
          )}
          {imageError && <p className="error-text">{imageError}</p>}
        </div>
          {error && (
  <p className={error.type === "success" ? "success-text" : "error-text"}>
    {error.text}
  </p>
)}
        <button type="submit" className="btn-primary" disabled={loading || uploading}>
          {loading || uploading ? (uploading ? "Uploading images..." : "Saving...") : (isEdit ? "Update Product" : "Create Product")}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;