const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../firebase.config");
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).array("images", 5); // Up to 5 images

exports.uploadImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      // If no files were uploaded, continue to next middleware
      if (!req.files || req.files.length === 0) {
        req.fileUrls = [];
        return next();
      }

      console.log(`Processing ${req.files.length} files...`);

      // Upload each file to Firebase Storage
      const uploadPromises = req.files.map(async (file) => {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileName = `images/${uniqueSuffix}-${file.originalname}`;
          const storageRef = ref(storage, fileName);
          
          console.log(`Uploading file: ${fileName}`);
          
          // Upload the file buffer directly (no need for streams)
          const snapshot = await uploadBytes(storageRef, file.buffer, {
            contentType: file.mimetype,
          });

          // Get the download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log(`File uploaded successfully: ${downloadURL}`);
          
          return downloadURL;
        } catch (fileError) {
          console.error('Error uploading file:', fileError);
          throw fileError;
        }
      });

      // Wait for all uploads to complete
      const fileUrls = await Promise.all(uploadPromises);
      req.fileUrls = fileUrls;
      
      console.log('All files uploaded successfully');
      next();
      
    } catch (uploadError) {
      console.error('Upload process error:', uploadError);
      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: uploadError.message
      });
    }
  });
};