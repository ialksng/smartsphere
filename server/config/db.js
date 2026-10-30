import mongoose from 'mongoose';

export let dbConnectionError = null;

export const getMongoUri = () => {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URL ||
    ''
  );
};

export const connectDB = async () => {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    dbConnectionError =
      'No MongoDB connection string found in environment variables (checked MONGO_URI, MONGODB_URI, DATABASE_URL, MONGO_URL)';
    console.warn(`⚠️ ${dbConnectionError}`);
    return;
  }
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbConnectionError = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    dbConnectionError = error.message;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};



