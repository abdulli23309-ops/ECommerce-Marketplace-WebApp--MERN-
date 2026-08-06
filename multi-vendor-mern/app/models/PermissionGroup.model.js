import mongoose from 'mongoose';

const permissionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  },
  { timestamps: true }
);

const PermissionGroup = mongoose.model('PermissionGroup', permissionGroupSchema);
export default PermissionGroup;
