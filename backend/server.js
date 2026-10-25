const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Configure CORS
const defaultOrigins = ['http://localhost:8080', 'http://127.0.0.1:8080'];
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
  })
);

// Body Parser Middleware
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Routes
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const saleRoutes = require('./routes/saleRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', saleRoutes);

// Error Handling Middleware (must be registered last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
