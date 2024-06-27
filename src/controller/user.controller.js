import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave : false });

        return {refreshToken,accessToken};
    } catch (error) {
        throw new ApiError(500,"Something Went Wrong While generating AR Token")
    }
}

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

//Login
const loginUser = asyncHandler( async ( req , res)=>{
    
     const {username, email , password} =  req.body
    
    // if(!username && !email){
    //     throw new ApiError(400, "username or email is Required")
    // }

    if(!(username || email)){
        throw new ApiError(400, "username or email is Required")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not Exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const { refreshToken , accessToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie('refreshToken',refreshToken,{httpOnly:true,secure:true})
    .cookie('accessToken',accessToken,{httpOnly:true,secure:true})
    .json(
        new ApiResponse(
            200,
            {
                accessToken,refreshToken,loggedInUser
            },
            "User Logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("refreshToken",{httpOnly:true,secure:true})
    .clearCookie("accessToken",{httpOnly:true,secure:true})
    .json( new ApiResponse(200,{},"User Logged Out") )
})

const refreshToken = asyncHandler(async (req,res)=>{
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // console.log("Access: ",accessToken)
    console.log("Refresh: ",oldRefreshToken)
    if(!oldRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(oldRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id)
        
        if(!user){
            throw new ApiError(401, "invalid Refresh Token")
        }
    
        if(oldRefreshToken != user.refreshToken){
            throw new ApiError(401, "Token Expired")
        }
    
        const {accessToken,refreshToken} = await generateAccessAndRefreshToken(decodedToken._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,{httpOnly:true,secure:true}) 
        .cookie("refreshToken",refreshToken,{httpOnly:true,secure:true}) 
        .json(
            new ApiResponse(
                200, 
                {accessToken, newrefreshToken: refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken
}