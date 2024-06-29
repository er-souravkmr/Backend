import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { deleteImage, uploadOnCloudinary } from "../utils/cloudinary.js";
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

    console.log(avatar.public_id);
   

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

const changePassword = asyncHandler(async (req,res)=>{
    const{password , newPassword} =  req.body;
    const user =  await User.findById(req.user?._id);
 
    const isPasswordCorrect = await user.isPasswordCorrect(password)
 
    if(!isPasswordCorrect){
         throw new ApiError(401, "Old password is Incorrect")
    }
 
    user.password = newPassword;
    user.save({validateBeforeSave:false})
 
    return res
    .status(200)
    .json(
      new ApiResponse(
         200,
         {},
         "Password Changed Sucessfully"
      )
    )
 
})

const getCurrentuser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current User fetched Successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    //get data and validate 
    const {fullName , email} = req.body
    if(!fullName || !email){
        throw new ApiError(
            400,
            "All fields are required"
        )
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {email,fullName}
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account updated Successfully"
        )
    )
})

const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.files?.path
    if(!avatarLocalPath){
        throw new ApiError(401,"File is missing")
    }

    const avatarImage = await uploadOnCloudinary(avatarLocalPath)
    if(!avatarImage.url){
        throw new ApiError(501,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar : avatarImage.url
            }
        },
        {new:true}
    ).select("-password")

    const deletedRef = await deleteImage(avatarImage.public_id)
    
    if(!deletedRef){
        throw new ApiError(500,"Avatar Not Deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar Image Changed Successfully"
        )
    )
})
const updateCover = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.files?.path
    if(!coverLocalPath){
        throw new ApiError(401,"File is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(501,"Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage : coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    const deletedRef = await deleteImage(coverImage.public_id)
    
    if(!deletedRef){
        throw new ApiError(500,"Cover Not Deleted")
    }
    

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image Changed Successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const{username} = req.params;
    if(!username?.trim()){
        throw new ApiError(401,"username is missing")
    }

    await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }

    ])
})
 
  
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changePassword,
    getCurrentuser,
    updateAccountDetails,
    updateCover,
    updateAvatar,
    getUserChannelProfile
}