// middleware/uploadAudio.js
import multer from "multer";

const storage = multer.memoryStorage();

const audioUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/webm", "audio/wav", "audio/mpeg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

export default audioUpload;
