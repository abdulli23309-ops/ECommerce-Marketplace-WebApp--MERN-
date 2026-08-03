import mongoose from 'mongoose';

const permissionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

const PermissionGroup = mongoose.model('PermissionGroup', permissionGroupSchema);
export default PermissionGroup;
