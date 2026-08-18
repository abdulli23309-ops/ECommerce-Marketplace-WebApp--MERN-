import * as productRepo from '../repositories/Product.repository.js';
import * as categoryRepo from '../repositories/Category.repository.js';
import * as brandRepo from '../repositories/Brand.repository.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getPublicProducts = (filters) => productRepo.findPublicWithFilters(filters);

export const getPublicProductById = async (id) => {
  const product = await productRepo.findPublicById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const startsWithIgnoreCase = (text, q) => {
  return typeof text === 'string' && text.toLowerCase().startsWith(q.toLowerCase());
};

export const getSuggestions = async (q) => {
  const query = q?.trim();
  if (!query || query.length < 2) {
    return { products: [], categories: [], brands: [] };
  }

  const [products, categories, brands] = await Promise.all([
    productRepo.findSuggestions(query, 5),
    categoryRepo.findAll(),
    brandRepo.findAll(),
  ]);

  const filteredCategories = categories
    .filter((c) => startsWithIgnoreCase(c.name, query))
    .slice(0, 3)
    .map((c) => ({ _id: c._id, name: c.name }));

  const filteredBrands = brands
    .filter((b) => startsWithIgnoreCase(b.name, query))
    .slice(0, 3)
    .map((b) => ({ _id: b._id, name: b.name }));

  return {
    products,
    categories: filteredCategories,
    brands: filteredBrands,
  };
};