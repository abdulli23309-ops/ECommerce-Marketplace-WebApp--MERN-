import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'PermissionGroup', default: null },
  },
  { timestamps: true, versionKey: false }
);

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
