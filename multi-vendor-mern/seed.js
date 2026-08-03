import mongoose from 'mongoose';
import { dbConf } from './app/config/init.js';
import Permission from './app/models/Permission.model.js';
import PermissionGroup from './app/models/PermissionGroup.model.js';
import Role from './app/models/Role.model.js';
import Store from './app/models/Store.model.js';

const permissionDefinitions = {
  Products: ['Products.View', 'Products.Create', 'Products.Update', 'Products.Delete'],
  Orders: ['Orders.View', 'Orders.Create', 'Orders.Update'],
  Users: ['Users.View', 'Users.Update'],
  Sellers: ['Sellers.View', 'Sellers.Approve'],
  Stores:   ['Store.CreateMultiple'], 
};

const rolePermissions = {
  Customer: ['Products.View', 'Orders.Create', 'Orders.View'],
  Seller: ['Products.View', 'Products.Create', 'Products.Update', 'Orders.View'],
  Admin: Object.values(permissionDefinitions).flat(),
};

const seedAuthorization = async () => {
  await mongoose.connect(dbConf.mongo.uri, dbConf.mongo.options);

  const groupIds = new Map();
  for (const groupName of Object.keys(permissionDefinitions)) {
    const group = await PermissionGroup.findOneAndUpdate(
      { name: groupName },
      { $setOnInsert: { name: groupName } },
      { returnDocument: 'after', upsert: true }
    );
    groupIds.set(groupName, group._id);
  }

  const permissionIds = new Map();
  for (const [groupName, names] of Object.entries(permissionDefinitions)) {
    for (const name of names) {
      const permission = await Permission.findOneAndUpdate(
        { name },
        { $set: { group: groupIds.get(groupName) } },
        { returnDocument: 'after', upsert: true }
      );
      permissionIds.set(name, permission._id);
    }
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await Role.findOneAndUpdate(
      { name: roleName },
      { $setOnInsert: { name: roleName } },
      { returnDocument: 'after', upsert: true }
    );
    await Role.updateOne(
      { _id: role._id },
      { $addToSet: { permissions: { $each: permissionNames.map((name) => permissionIds.get(name)) } } }
    );
  }

  console.log('Authorization roles, permission groups, and permissions are ready.');
};

seedAuthorization()
  .catch((error) => {
    console.error('Authorization seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
