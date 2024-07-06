import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/twitter.model.js";
import { Like } from "../models/likes.model.js";


const createTweet = asyncHandler(async (req,res)=>{
    const {content} = req.body;
    if(!content){
        throw new ApiError(401,"Content is Required");
    }

    const addedTweet = await Tweet.create({
        content: content,
        owner:req.user?._id
    })

    if(!addedTweet){
        throw new ApiError(401,"Failed to Create Tweet, Please try again")
    }

    return res.status(200).json(new ApiResponse(200,addedTweet,"Tweeted Successfuly"))
})


const updateTweet = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"Provide Valid ID")
    }
    if(!content){
        throw new ApiError(401,"Content is Required")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(401,"No Tweet Found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401,"Unauthorized Request to update Tweet")
    }

    const newTweet = await Tweet.findByIdAndUpdate( tweetId,
        {
            $set:{
              content : content
            }
        },
        {new:true}
    )

    if(!newTweet){
        throw new ApiError(501,"Cant Update, Please Try Again ")
    }

    return res.status(200).json(new ApiResponse(200,newTweet,"Tweet Updated Successfully"))
    
})

const deleteTweet = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"Provide Valid ID")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(401,"No Tweet Found")
    }
    
    const oldTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!oldTweet){
        throw new ApiError(401,"Cant Delete Tweet , Please try again")
    }

    await Like.deleteMany(
        {
            tweet : tweetId,
            likedBy : req.user?._id 
        }
    )

    return res.status(200).json(new ApiResponse(
        400,
        {deleted : true},
        "Deleted Successfully"
    ))
    
})

const getUserTweet = asyncHandler(async (req,res)=>{
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(401,"Invalid User")
    }
    
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $lookup:{
                from : "likes",
                localField:"_id",
                foreignField:"tweet",
                as: 'likeDetails',
                pipeline:[
                    {
                        $project:{
                            likedBy:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as : 'ownerDetails',
                pipeline:[
                    {
                        $project:{
                            username :1,    
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size : "$likeDetails"
                },
                owner:{
                    $first : "$ownerDetails"
                },
                isLiked:{
                    $cond:{
                        if: {$in:[req.user?._id,"$likeDetails.likedBy"]},
                        then: true,
                        else:false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                content: 1,
                owner: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }

    ])
    
    if(tweets.length < 1){
        throw new ApiError(500 ,"No Tweets Found")
    }

    return res
           .status(200)
           .json(
                new ApiResponse(
                    200,
                    tweets,
                    "All tweets Fetched"
                )
           )
})

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweet
}