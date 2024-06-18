import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
    });

// Upload an image
const uploadOnCloudinary = async (localfilepath)=>{

    try {
        if(!localfilepath) return null
        const response =  await cloudinary.uploader.upload(localfilepath,{resource_type:'auto'} )

         console.log('File is uploaded on cloudinary.',response.url)
         return response

}catch(error){
    fs.unlinkSync(localfilepath) //remove the locally saved temprary files
    return null 
    
}
}

export {uploadOnCloudinary}