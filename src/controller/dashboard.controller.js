import mongoose from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponse} from  "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subs.model.js";

const getChannelStats = asyncHandler(async (req,res)=>{

    const totalSubscriber = await Subscription.aggregate([
        {
            $match:{
                channel:req.user?._id
            }
        },
        {
           $group:{
             _id:null,
             subscriberCount:{$sum : 1}
           }
        }
    ])

    const video = await Video.aggregate([
       {
            $match:{
                owner : req.user?._id
            }
       },
       {
            $lookup:{
                from : "likes",
                localField:'_id',
                foreignField:'video',
                as:'likes'
            }
       },
       {
            $project:{
                likeCount:{
                    $size:'$likes'
                },
                viewsCount:"$views",
                totalVideos:1
            }
       },
       {
            $group:{
               _id:null,
               totalLikes: {
                $sum : "$likeCount"
               } ,
               totalViews: {
                $sum : "$viewsCount"
               } ,
               totalVideos: {
                $sum : 1
               } 
            }
       }
    ])
    console.log(video);

    if(!totalSubscriber || !video){
        throw new ApiError(500,"Cant Fetch Channel Stats")
    }

    const stats = {
        subscriberCount: totalSubscriber[0]?.subscriberCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalVideos: video[0]?.totalVideos || 0,
        totalViews: video[0]?.totalViews || 0,
        
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "Stats Fetched"
        )
    )
})

const getChannelVideos = asyncHandler(async (req,res)=>{
    const videos = await Video.aggregate([
        {
            $match:{
                owner : req.user?._id
            }
        },
        {
            $lookup:{
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as:'likes'
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size : '$likes'
                },
                createdAt:{
                    $dateToParts:{date:"$createdAt"} 
                }
            }
        },
        {
            $sort:{createdAt:-1}
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                views:1,
                duration:1,
                isPublished:1,
                likeCount:1,
                createdAt:{
                    year: 1,
                    month: 1,
                    day: 1
                }
            }
        }
    ])

    if(!videos){
        throw new ApiError(500 , "Can't Fetch Video , Try Again")
    }

    return res.status(200).json(new ApiResponse(200,videos,"Videos Fetched Successfully"))
})


export {getChannelStats,getChannelVideos}