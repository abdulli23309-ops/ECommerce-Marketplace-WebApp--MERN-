import Brand from '../models/Brand.model.js';

export const create = (data) => Brand.create(data);
export const findAll = () => Brand.find({ isDeleted: false });
export const findById = (id) => Brand.findOne({ _id: id, isDeleted: false });
export const updateById = (id, data) => Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const softDelete = (id) => Brand.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

export const findAllPaginated = async ({
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "newest",
}) => {
  const query = { isDeleted: false };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const sort =
    sortBy === "name_asc"
      ? { name: 1 }
      : sortBy === "name_desc"
      ? { name: -1 }
      : { createdAt: -1 };

  const skip = (page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    Brand.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    Brand.countDocuments(query),
  ]);

  return {
    items,
    totalItems,
    page,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize),
  };
};