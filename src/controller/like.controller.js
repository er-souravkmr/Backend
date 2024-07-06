import mongoose, { isValidObjectId } from "mongoose";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";
import { asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js"
import { Like } from "../models/likes.model.js";


const toggleVideoLikes = asyncHandler(async (req,res)=>{
    const {videoId} = req.params 
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video Id is Invalid")
    }

    const alradyLiked = await Like.findOne(
        { 
            video : videoId,
            likedBy : req?.user?._id
        }
    )

    if(alradyLiked){
         await Like.findByIdAndDelete(alradyLiked?._id);
         return res.status(200).json(new ApiResponse(200,{isLiked : false}))
    }

    await Like.create(
       {
         video: videoId,
         likedBy :  req.user?._id
       }
    )

    return res.status(200).json(new ApiResponse(200,{isLiked:true}))

}) 

const toggleCommentLike = asyncHandler(async (req,res)=>{
    const {commentId} =req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Comment Id is Invalid")
    }

    const alreadyLiked = await Like.findOne(
        {
            comment : commentId,
            likedBy : req?.user?._id 
        }
    )

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res.status(200).json(new ApiResponse(200 , {isLiked:false}))
    }

    await Like.create(
        {
            comment : commentId,
            likedBy : req?.user?._id 
        }
    )

    return res.status(200).json(new ApiResponse(200 , {isLiked:true}))

})

const toggleTweetLike = asyncHandler(async (req,res)=>{
    const {tweetId} =req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "Comment Id is Invalid")
    }

    const alreadyLiked = await Like.findOne(
        {
            tweet : tweetId,
            likedBy : req?.user?._id 
        }
    )

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res.status(200).json(new ApiResponse(200 , {isLiked:false}))
    }

    await Like.create(
        {
            tweet : tweetId,
            likedBy : req.user?._id 
        }
    )

    return res.status(200).json(new ApiResponse(200 , {isLiked:true}))

})


const getAllLikedVideo = asyncHandler(async(req,res)=>{
    const videos = await Like.aggregate([
        {
            $match :{ likedBy : new mongoose.Types.ObjectId(req.user?._id) }
        },
        {
            $lookup: {
                from : "videos",
                localField: "video",
                foreignField : "_id",
                as : "likedVideo",
                pipeline:[
                    {
                        $lookup:{
                            from : "users",
                            localField: "owner",
                            foreignField : "_id",
                            as : "ownerDetails",
                        }
                    },
                    {
                        $unwind : "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind : "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project:{
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            }
        }
    ])

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videos,
                    "All Video fetched"
                )
            )

})




export {
    toggleVideoLikes,
    toggleCommentLike,
    toggleTweetLike,
    getAllLikedVideo
}