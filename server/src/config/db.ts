import mongoose from "mongoose";

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "[Database Error]: MONGO_URI ortam değişkeni tanımlanmamış.",
      );
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`🟢 [Database]: MongoDB Bağlandı: ${conn.connection.host}`);
  } catch (error) {
    console.error("🔴 [Database Error]: Bağlantı hatası:", error);
    process.exit(1);
  }
};
