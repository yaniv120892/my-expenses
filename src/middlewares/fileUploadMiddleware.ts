import multer from 'multer';
import fileUploadService from '../services/fileUploadService';

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = fileUploadService.getAllowedMimeTypes();
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileUploadService.getMaxFileSize(),
  },
});

export const uploadSingleFile = upload.single('file');
export const uploadMultipleFiles = upload.array('files', 10);

export default { uploadSingleFile, uploadMultipleFiles };