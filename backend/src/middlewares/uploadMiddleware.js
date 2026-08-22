const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadBaseDir = path.join(__dirname, '..', 'public', 'uploads');
const folders = ['misc', 'categories', 'products', 'videos', 'banners', 'ads', 'notifications', 'withdrawals', 'settings'];

folders.forEach(folder => {
  const dir = path.join(uploadBaseDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const resolveUploadDestination = (routePath = '') => {
  let subfolder = 'misc';

  if (routePath.includes('product-categories') || routePath.includes('categories')) {
    subfolder = 'categories';
  } else if (routePath.includes('products')) {
    subfolder = 'products';
  } else if (routePath.includes('videos')) {
    subfolder = 'videos';
  } else if (routePath.includes('banners')) {
    subfolder = 'banners';
  } else if (routePath.includes('ads') || routePath.includes('advertisements')) {
    subfolder = 'ads';
  } else if (routePath.includes('notifications')) {
    subfolder = 'notifications';
  } else if (routePath.includes('withdrawals')) {
    subfolder = 'withdrawals';
  } else if (routePath.includes('settings')) {
    subfolder = 'settings';
  }

  const destination = path.join(uploadBaseDir, subfolder);
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  return destination;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resolveUploadDestination(req.originalUrl));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.resolveUploadDestination = resolveUploadDestination;
