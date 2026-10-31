import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async (): Promise<void> => {
  const atlasUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/subscription_db';

  try {
    if (atlasUri) {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log('MongoDB Atlas Connected successfully!');
      return;
    }
  } catch (err: any) {
    console.warn('MongoDB Atlas connection failed:', err.message);
    console.log('Falling back to local MongoDB at', localUri);
  }

  try {
    await mongoose.connect(localUri);
    console.log('Local MongoDB Connected successfully!');
  } catch (err: any) {
    console.error('CRITICAL: All MongoDB connections failed:', err.message);
    process.exit(1);
  }
};
