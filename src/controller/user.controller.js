import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js";

//Register 
const registerUser = asyncHandler( async (req ,res)=>{

    const {fullName,email,password,username} = req.body;

    if([fullName,email,password,username].some((field)=>(field?.trim)=="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{email},{username}]
    })

    console.log(existedUser)

    if(existedUser){
        throw new ApiError(400,"user already Exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user  = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url||"",
        password,
        email,
        username : username.toLowerCase()
    })
    console.log(user)

    const createdUser =  await User.findById(user._id).select("-password -refreshToken")
    console.log(createdUser)

    if(!createdUser){
        throw new ApiError(500,"Something went Wrrong While Registering")
    }

    return res.ApiResponse(200,createdUser,"User registerd Sucessfully")

})



export {registerUser}