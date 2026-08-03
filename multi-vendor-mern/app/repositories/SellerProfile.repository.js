import SellerProfile from '../models/SellerProfile.model.js';

const findByUser = (userId) => SellerProfile.findOne({ user: userId });
const create = (data) => SellerProfile.create(data);

export { create, findByUser };
