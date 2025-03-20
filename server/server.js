import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';

const port = process.env.PORT || 5000;
const app = express();

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas');

    // Routes
    app.use('/api/user', userRouter);
    app.use('/api/image', imageRouter);

    // Default route
    app.get('/', (req, res) => {
      res.send('API working!');
    });

    // Start the server
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the process with failure
  }
};

// Start the server
startServer();