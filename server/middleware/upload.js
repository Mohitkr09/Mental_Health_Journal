import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ✅ Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "avatars", // store inside "avatars" folder in Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "webp"], // added webp
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // unique name
      transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }], 
      // auto crop around face, square ratio
    };
  },
});

// ✅ File filter (extra layer of security)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = file.mimetype.split("/")[1];
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg, .png, .webp files are allowed!"), false);
  }
};

// ✅ Max file size 20MB
const limits = { fileSize: 20 * 1024 * 1024 };

const parser = multer({ storage, fileFilter, limits });

export default parser;
