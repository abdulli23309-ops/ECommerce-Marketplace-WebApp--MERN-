import mongoose from 'mongoose';
import { dbConf } from './app/config/init.js';
import Category from './app/models/Category.model.js';
import SubCategory from './app/models/SubCategory.model.js';

const catalog = [
  {
    name: 'Mobiles & Tablets',
    subs: ['Smartphones', 'iPhone', 'Android Phones', 'Tablets', 'Smartwatches', 'Mobile Accessories', 'Chargers & Cables', 'Power Banks']
  },
  {
    name: 'Computers & Laptops',
    subs: ['Laptops', 'Gaming Laptops', 'Desktop Computers', 'Monitors', 'Printers', 'Computer Accessories', 'Keyboards & Mice', 'Storage', 'Networking', 'PC Components']
  },
  {
    name: 'TVs & Home Entertainment',
    subs: ['LED TVs', '4K TVs', 'QLED TVs', 'OLED TVs', 'Mini LED TVs', 'Soundbars', 'Home Theater', 'Speakers', 'TV Accessories']
  },
  {
    name: 'Home Appliances',
    subs: ['Refrigerators', 'Washing Machines', 'Dryers', 'Dishwashers', 'Ovens', 'Cookers', 'Freezers', 'Built-in Appliances']
  },
  {
    name: 'Air Conditioners',
    subs: ['Split AC', 'Window AC', 'Portable AC', 'Floor Standing AC', 'Air Coolers', 'AC Accessories']
  },
  {
    name: 'Small Appliances',
    subs: ['Air Fryers', 'Coffee Machines', 'Blenders', 'Food Processors', 'Juicers', 'Electric Kettles', 'Irons', 'Vacuum Cleaners', 'Microwaves', 'Air Purifiers']
  },
  {
    name: 'Gaming',
    subs: ['PlayStation', 'Xbox', 'Nintendo', 'Gaming PCs', 'Gaming Monitors', 'Gaming Keyboards', 'Gaming Mice', 'Controllers', 'Gaming Headsets', 'Gaming Chairs', 'Video Games']
  },
  {
    name: 'Cameras & Photography',
    subs: ['Digital Cameras', 'DSLR Cameras', 'Mirrorless Cameras', 'Action Cameras', 'Lenses', 'Camera Bags', 'Tripods', 'Camera Accessories']
  },
  {
    name: 'Audio',
    subs: ['Headphones', 'Earbuds', 'Bluetooth Speakers', 'Wireless Speakers', 'Sound Systems', 'Microphones', 'Audio Accessories']
  },
  {
    name: 'Smart Home',
    subs: ['Security Cameras', 'Smart Lighting', 'Smart Plugs', 'Smart Speakers', 'Smart Displays', 'Smart Locks', 'Smart Home Accessories']
  },
  {
    name: 'Personal Care',
    subs: ['Electric Shavers', 'Hair Dryers', 'Hair Straighteners', 'Hair Stylers', 'Electric Toothbrushes', 'Epilators', 'Personal Care Accessories']
  },
  {
    name: 'Wearables',
    subs: ['Smartwatches', 'Fitness Trackers', 'Smart Bands', 'Wearable Accessories']
  },
  {
    name: 'Networking',
    subs: ['Wi-Fi Routers', 'Mesh Wi-Fi', 'Network Switches', 'Range Extenders', 'Modems', 'Network Accessories']
  },
  {
    name: 'Accessories',
    subs: ['Cables', 'Chargers', 'Power Banks', 'USB Hubs', 'Adapters', 'Power Strips', 'Device Accessories']
  }
];

const seedCatalog = async () => {
  await mongoose.connect(dbConf.mongo.uri, dbConf.mongo.options);

  console.log('Seeding catalog…');

  for (const cat of catalog) {
    // Upsert category
    const category = await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: { name: cat.name, isActive: true } },
      { upsert: true, new: true }
    );
    console.log(`Category: ${category.name} (${category._id})`);

    // Upsert subcategories
    for (const subName of cat.subs) {
      const sub = await SubCategory.findOneAndUpdate(
        { name: subName, category: category._id },
        { $setOnInsert: { name: subName, category: category._id, isActive: true } },
        { upsert: true, new: true }
      );
      console.log(`  └─ SubCategory: ${sub.name} (${sub._id})`);
    }
  }

  console.log('Catalog seeding complete.');
  mongoose.disconnect();
};

seedCatalog().catch(err => {
  console.error('Catalog seed failed:', err.message);
  process.exit(1);
});