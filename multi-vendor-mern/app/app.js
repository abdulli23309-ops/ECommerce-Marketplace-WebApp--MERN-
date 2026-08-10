import express from 'express';
import authRoutes from './routes/Auth.routes.js';
import authorizationTestRoutes from './routes/AuthorizationTest.routes.js';
import { setupAppMiddleware, errorHandler } from './middleware/init.js';
import productRoutes from './routes/Product.routes.js';
import storeRoutes from './routes/Store.routes.js';
import categoryRoutes from './routes/Category.routes.js';
import subCategoryRoutes from './routes/SubCategory.routes.js';
import brandRoutes from './routes/Brand.routes.js';
import publicProductRoutes from './routes/Product.public.routes.js';
import cartRoutes from './routes/Cart.routes.js';
import wishlistRoutes from './routes/Wishlist.routes.js';
import addressRoutes from './routes/Address.routes.js';
import orderRoutes from './routes/Order.routes.js';
import paymentRoutes from './routes/Payment.routes.js';
import shipmentRoutes from './routes/Shipment.routes.js';
import reviewRoutes from './routes/Review.routes.js';
import returnRoutes from './routes/Return.routes.js';
import refundRoutes from './routes/Refund.routes.js';
import adminRoutes from './routes/Admin.routes.js';
import accountRoutes from './routes/Account.routes.js';
import sellerRoutes from './routes/Seller.routes.js';
import adminProductRoutes from './routes/AdminProduct.routes.js';
import webhookRouter from './routes/webhook.routes.js';

const app = express();

// ---------- Stripe webhook MUST be mounted BEFORE global body parsers ----------
app.use('/api/v1/payments/webhook', webhookRouter);

// ---------- Global middleware (includes express.json()) ----------
setupAppMiddleware(app);

// Serve uploaded files
app.use('/uploads', express.static('app/uploads'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ---------- Other routes ----------
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/test', authorizationTestRoutes);
app.use('/api/v1/products/public', publicProductRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
// (No duplicate webhook mount here)
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/seller', sellerRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;