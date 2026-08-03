import express from 'express';
import authRoutes from './routes/Auth.routes.js';
import authorizationTestRoutes from './routes/AuthorizationTest.routes.js';
import { setupAppMiddleware, errorHandler } from './middleware/init.js';
import productRoutes from './routes/Product.routes.js';
import storeRoutes from './routes/Store.routes.js';
import categoryRoutes from './routes/Category.routes.js';
import subCategoryRoutes from './routes/SubCategory.routes.js';
import brandRoutes from './routes/Brand.routes.js';


const app = express();

setupAppMiddleware(app);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/test', authorizationTestRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/brands', brandRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
