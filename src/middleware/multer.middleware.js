import multer from "multer";

// it is middleware that handle file in  enctype:multipart form

// used to store file in public/temp in local with filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
 export const upload = multer({
     storage,
 })