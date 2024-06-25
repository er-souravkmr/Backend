import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//Register 
const registerUser = asyncHandler( async (req ,res)=>{

    //getting data in variable from body
    const {fullName,email,password,username} = req.body;

    //throwing error if req fields are empty
    if([fullName,email,password,username].some((field)=>(field?.trim)=="")){
        throw new ApiError(400,"All fields are required")
    }

    //checking if user exist, if exist throw error
    const existedUser = await User.findOne({
        $or : [{email},{username}]
    })
    if(existedUser){
        throw new ApiError(400,"user already Exist")
    }

    // Checking if there is file in form if yes getting its path
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //Throwing error if avatar which is required file is null
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    //Creating Model in DB
    const user  = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url||"",
        password,
        email,
        username : username.toLowerCase()
    })  

    
    const createdUser =  await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Something went Wrrong While Registering")
    }

    // Sending Response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export {registerUser}