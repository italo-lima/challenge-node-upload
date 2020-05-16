import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

export const tempFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default multer({
  storage: multer.diskStorage({
    destination: tempFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
  fileFilter: (request, file, callback) => {
    const allowedMimes = ['text/csv'];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type.'));
    }
  },
});
