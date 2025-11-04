import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "placemate_resumes",
    allowed_formats: ["pdf", "doc", "docx"],
    resource_type: "raw", // for non-image files
  },
});

const upload = multer({ storage });

export default upload;
