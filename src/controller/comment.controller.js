import mongoose, { isValidObjectId } from "mongoose"
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2"
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponse} from  "../utils/apiResponse.js";
import {Video} from "../models/video.model.js";
import {Comment} from "../models/comments.model.js"
import {Like} from "../models/likes.model.js"


const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid ID")
    }   

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video Not Found")
    }   

    const comments =  await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from : "likes",
                localField:"_id",
                foreignField:"comment",
                as :'likes'  
            }
        },
        {
            $lookup:{
                from:"users",
                localField: "owner",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size : "$likes"
                },
                owner:{
                    $first : "$ownerDetails"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project:{
                content:1,
                createdAt:1,
                likesCount:1,
                owner:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked:1
            }
        }
    ])

    if(!comments){
        throw new ApiError(
            501,
            "No Comments Found"
        )
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    } 

    const commentPaginate = await Comment.aggregatePaginate(comments,options);

    if(!commentPaginate){
        throw new ApiError(
            402,
            "Failed to Paginate"
        )
    }

    return res.status(200).json(new ApiResponse(200, commentPaginate , "Comment Fetched"))

})

const addComment = asyncHandler(async (req, res) => {
    
   const {videoId} = req.params;
   const {content} = req.body;

   if(!content){
     throw new ApiError(400 , "Content can't be Empty")
   }

   if(!isValidObjectId(videoId)){
     throw new ApiError(400 , "Invalid Video ID")
   }

   const video = await Video.findById(videoId);
   if(!video){
    throw new ApiError(400 , " Video not Found")
   }

   const addedComment = await Comment.create(
        {
            content: content,
            video:videoId,
            owner : req.user?._id
        }
   )

   if(!addedComment){
     throw new ApiError(501 , "Failed to add comment please try again")
   }

   return res.status(200).json(new ApiResponse(200,addedComment , "Comment Added"))


})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
      throw new ApiError(400 , "Content can't be Empty")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!isValidObjectId(comment)){
        throw new ApiError(400 , "Comment doesn't exist")
    }

    if((comment?.owner).toString() !== (req.user?.id).toString()){
      throw new ApiError(400 , "You Cant Update as You are Not the Owner")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
          $set:{
            content : content
          }
        },
        {new:true} 
    )

    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment edited successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(401,"Invalid Id")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(401,"Comments Not Found")
    }

    if(comment?.owner.toString() !== req.user?._id.tostring()){
        throw new ApiError(401,"You are not Owner")
    }

    await Comment.findByIdAndDelete(commentId);
    await Like.deleteMany({
        comment : commentId,
        likedBy : req.user
    })

    return res.status(200).json(new ApiResponse(200,{commentId},"Deleted Succesfully"))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}