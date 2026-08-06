import mongoose from 'mongoose';
import { dbConf } from './app/config/init.js';
import Permission from './app/models/Permission.model.js';
import PermissionGroup from './app/models/PermissionGroup.model.js';
import Role from './app/models/Role.model.js';

const permissionDefinitions = {
  Products: [
    'Products.View', 'Products.Create', 'Products.Edit', 'Products.Delete',
    'Products.Approve'
  ],
  Orders: [
    'Orders.View', 'Orders.Create', 'Orders.Update',
    'Orders.Cancel',
    'Orders.Refund'
  ],
  Users: ['Users.View', 'Users.Update', 'Users.Manage'],
  Sellers: ['Sellers.View', 'Sellers.Approve'],
  Stores: ['Store.CreateMultiple', 'Store.Edit', 'Store.Shipments'],
 SellerPanel: [
  'Seller.Dashboard.View',
  'Seller.Products.View',      // see the product list
  'Seller.Products.Create',    // add new product
  'Seller.Products.Edit',      // edit existing product
  'Seller.Products.Delete',    // soft‑delete a product
  'Seller.Orders.View',
  'Seller.Reviews.View',
  'Seller.Store.Manage',
],
  Customers: ['Customers.View', 'Customers.Edit'],
  Reports: ['Reports.View', 'Reports.Export'],
  Categories: ['Categories.Manage'],
  Brands: ['Brands.Manage'],
  Permissions: ['Permissions.Manage'],
  Roles: ['Roles.Manage'],
};


const groupPermissions = {
  'Seller Basic': [
    'Products.View', 'Products.Create', 'Products.Edit', 'Products.Delete',
    'Orders.View', 'Orders.Create', 'Orders.Update', 'Orders.Cancel',
    'Store.Edit', 'Store.Shipments', 'Customers.View', 'Reports.View'
  ]
};

const seedAuthorization = async () => {
  await mongoose.connect(dbConf.mongo.uri, dbConf.mongo.options);

  // 1. Upsert groups
  const groupIds = new Map();
  for (const groupName of Object.keys(permissionDefinitions)) {
    const group = await PermissionGroup.findOneAndUpdate(
      { name: groupName },
      { $setOnInsert: { name: groupName } },
      { returnDocument: 'after', upsert: true }
    );
    groupIds.set(groupName, group._id);
  }
  for (const groupName of Object.keys(groupPermissions)) {
    const group = await PermissionGroup.findOneAndUpdate(
      { name: groupName },
      { $setOnInsert: { name: groupName } },
      { returnDocument: 'after', upsert: true }
    );
    groupIds.set(groupName, group._id);
  }

  // 2. Upsert permissions and assign group + code
  const permissionIds = new Map();
  for (const [groupName, names] of Object.entries(permissionDefinitions)) {
    for (const name of names) {
      const permission = await Permission.findOneAndUpdate(
        { name },
        { $set: { group: groupIds.get(groupName), code: name } },
        { upsert: true, returnDocument: 'after' }
      );
      permissionIds.set(name, permission._id);
    }
  }

  // 3. Populate each group's permissions array
  for (const [groupName, names] of Object.entries(permissionDefinitions)) {
    const groupId = groupIds.get(groupName);
    if (!groupId) continue;
    const permIds = names.map(name => permissionIds.get(name)).filter(Boolean);
    await PermissionGroup.findByIdAndUpdate(
      groupId,
      { $addToSet: { permissions: { $each: permIds } } }
    );
  }


  // 5. Assign permissions to groups defined in groupPermissions (e.g., Seller Basic)
  for (const [groupName, permissionNames] of Object.entries(groupPermissions)) {
    const groupId = groupIds.get(groupName);
    if (!groupId) continue;
    const permIds = permissionNames.map(name => permissionIds.get(name)).filter(Boolean);
    await PermissionGroup.findByIdAndUpdate(
      groupId,
      { $addToSet: { permissions: { $each: permIds } } }
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