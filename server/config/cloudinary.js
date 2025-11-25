// server/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

// ✅ Secure modern config (v2.8.0 compatible)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,                       // 🔒 Force HTTPS
  // private_cdn: false,              // optional
  // secure_distribution: "xyz.com",  // optional custom CDN
});

export default cloudinary;
