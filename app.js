import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import sequelize from './config/db.js';
import usersRoutes from './routes/v1/usersRoutes.js'
import journalRoutes from './routes/v1/journalRoutes.js';
import { populateCategories } from './Sequelize/categories.js';
dotenv.config();

const app = express();
const allowedDomain = 'http://localhost:4200'; 

// CORS Configuration
const corsOptions = {
  origin: allowedDomain, 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], 
};

// Middleware Setup
app.use(cookieParser()); 
app.use(cors(corsOptions)); 
app.use(express.json()); 

// Routes

app.use('/v1/users', usersRoutes);
app.use('/v1/journals', journalRoutes);

// Sync Database and Start Server
sequelize.sync()
  .then(async() => {
    await populateCategories();
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });
