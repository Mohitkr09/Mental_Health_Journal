import multer from "multer";

// Store audio in memory (buffer)
const storage = multer.memoryStorage();

const audioUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    // Some browsers (Chrome) record audio as video/webm
    const allowed = [
      "audio/webm",
      "video/webm",
      "audio/ogg",
      "audio/wav",
      "audio/mpeg",
      "audio/mp4",
      "audio/3gpp",
    ];

    console.log("📥 Incoming file:", {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
    });

    // Only allow the field name "audio"
    if (file.fieldname !== "audio") {
      console.error("❌ Unexpected field:", file.fieldname);
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
    }

    // Validate mimetype
    if (!file.mimetype || !allowed.includes(file.mimetype)) {
      console.error("❌ Unsupported type:", file.mimetype);
      return cb(new Error("Unsupported file type: " + file.mimetype));
    }

    console.log("🎧 Accepted:", file.mimetype);
    cb(null, true);
  },
});

export default audioUpload;
