import { v2 as cloudinary } from 'cloudinary';
import  fs  from 'fs';


// Configuration of cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});



// Upload file from publlic/temp i.e. localFilePath to cloudinary and return URL of fiile at cloudinary

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type : "auto"})
        console.log("File is uploaded" , response.url)
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}


async function deleteFile(id) {
    try {
        if(!id) return null;
        const result = await cloudinary.uploader.destroy(id);
        console.log('Deleted image:', result);
        return result;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

export {uploadOnCloudinary , deleteFile};