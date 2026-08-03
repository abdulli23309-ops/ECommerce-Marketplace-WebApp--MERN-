import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// A subcategory name must be unique within its category (for non‑deleted ones)
subCategorySchema.index(
  { name: 1, category: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
export default SubCategory;