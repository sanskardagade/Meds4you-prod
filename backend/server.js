import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import {authenticateToken} from './middlewares/authMiddleware.js';
import userRoutes from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import referrerRoutes from './routes/referrerRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use('/api/auth', authRoute);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes); 
app.use('/api/cart', authenticateToken, cartRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use("/api/prescriptions",authenticateToken, prescriptionRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/partners', partnerRoutes);
app.use("/uploads", express.static("/var/www/uploads"));


app.get('/', (req, res) => {
  res.send("Backend Running Successfully");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
