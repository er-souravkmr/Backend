import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {Subscription} from "../models/subs.model.js"

const toggleSubscription = asyncHandler(async (req,res)=>{
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(401, "Invalid Id Provided")
    }

    const subs = await Subscription.findOne(
       { 
        subscribers: req.user?._id,
        channel: channelId
       }
    )

    if(subs){
        await Subscription.findByIdAndDelete(subs?._id)
        
        return res.status(200).json(
            new ApiResponse(
                200,
            {subscribed:false},
            "Unsubscribed"
            )
        )
    }

    const data = await  Subscription.create(
       { 
        subscribers : req.user?._id,
        channel:channelId
       }
    )  

    return res.status(200).json(
        new ApiResponse(
            200,
        {subscribed:true},
        "Subscribed"
        )
    )

})

const getUserChannelSubscribers = asyncHandler(async (req,res)=>{
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(401, "Invalid Id Provided")
    }

    const subs = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from : "users",
                localField: "subscribers",
                foreignField: "_id",
                as : "subscriber",
                pipeline:[
                    {
                        $lookup:{
                            from : "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as : "isSubscribed"
                        }
                    },
                    {
                        $addFields:{
                            subscribedToSubscriber:{
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$isSubscribed.subscribers",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                            subscriberCount:{
                                $size : "$isSubscribed"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$subscriber"
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    isSubscribed: 1,
                    subscribedToSubscriber: 1,
                },
            }
        }
        
    ])

    if(!subs){
        throw new ApiError(501, "Failed to fetch")
    }

    return res.status(200).json(new ApiResponse(200,subs,"Fetched"))

})

const getSubscribedChannels = asyncHandler(async (req,res)=>{
    const { subscriberId } = req.params;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(401, "Invalid Id Provided")
    }

    console.log(subscriberId)
    const subscribedChannel = await Subscription.aggregate([
        {
            $match :{
                subscribers: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from : 'users',
                localField:"channel",
                foreignField:"_id",
                as : "subscribedChannel",
                pipeline:[
                    {
                        $lookup:{
                            from : 'videos',
                            localField:"_id",
                            foreignField:"owner",
                            as : "videos"
                        }
                    },{
                        $addFields:{
                            latestVideo:{
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$subscribedChannel"
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    latestVideo: {
                        _id: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    },
                },
            },
        }
    ])

    console.log(subscribedChannel)

    return res.status(200).json(new ApiResponse(200,subscribedChannel,"Fetched"))
})


export {
    toggleSubscription,
    getUserChannelSubscribers ,
    getSubscribedChannels 
};