import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartsphere';
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not crash process so web server stays alive on cloud hosts (e.g. Render)
    console.warn('⚠️ Server will continue running; please verify MONGO_URI in environment variables.');
  }
};


