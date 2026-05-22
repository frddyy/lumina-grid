import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api', apiRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`SSE Backend Server running on http://localhost:${PORT}`);
  });
}).catch(console.error);
