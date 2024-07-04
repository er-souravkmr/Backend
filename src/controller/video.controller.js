import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { deleteFile, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose,{ isValidObjectId} from "mongoose";


const getAllVideos = asyncHandler(async (req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query


    const pipeline = [];

    //Create search index in mongo db atlas 

    if(query){
        pipeline.push( {
            $search: {
              index: "searchVideo",
              text: {
                query: query,
                path: ["title", "description"] 
              }
            }
          })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(401,"Invalid UserId")
        }

        pipeline.push({
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // Show Only where is Pulbished Field is true

    pipeline.push({
        $match : {
            isPublished:true
        }
    })

    //Perform Sorting
    if(sortBy && sortType){
        pipeline.push({
            $sort:{
                [sortBy]: sortType === "asc"? 1:-1
            }
        })
    }else{
        pipeline.push({$sort:{createdAt:1}})
    }

    // getting Video Owner  Detail using lookup
    pipeline.push(
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerDetail",
            pipeline:[
            {
                $project:{
                    username:1,
                    avatar:1
                }
            }
        ]  
        }

       
    },
    {
        $unwind: "$ownerDetail"
    })

    // console.log(pipeline)

    const videoDetail = Video.aggregate(pipeline);
   
    // console.log(videoDetail)
    
    if(videoDetail.length < 1){
        throw new ApiError(501,"Video not Found or Private")
    }

    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    }

    const video = await Video.aggregatePaginate(videoDetail, options);
    // console.log(video)

    if(!video){
        throw new ApiError(501,"Video Cant List ")
    }

    
    return res.status(200).json(new ApiResponse(200,video,"Video Fetched Successfully"));
})


const publishAVideo = asyncHandler(async (req,res)=>{
    const {title, description} = req.body;

    if([title, description].some((field) => field?.trim() === "")){
        throw new ApiError(401,"Title is Required")
    }
   

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath) {
        throw new ApiError(401,"Video File is missing")
    }

    if(!thumbnailLocalPath) {
        throw new ApiError(401,"Thumbnail is missing")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // console.log( videoFile)
    // console.log( thumbnail)

    if(!videoFile){
        throw new ApiError(500,"Video can't Upload")
    }
    if(!thumbnail){
        throw new ApiError(500,"Thumbnail can't Upload")
    }


  
    const video = await Video.create({
        title,
        description,
        duration:videoFile.duration,
        videoFile:{
            url:videoFile.url,
            public_id : videoFile.public_id
        },
        thumbnail:{
            url:thumbnail.url,
            public_id : thumbnail.public_id
        },
        owner:req.user?._id,
        isPublished:true
    })

    const videoUploaded = await Video.findById(video?._id)

    if(!videoUploaded){
        throw new ApiError(400,"Video failed to upload")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Published Successfully")
    )


});

const getVideoById = asyncHandler(async (req,res)=>{
    const {video_id} = req.params

    console.log(video_id)

    if(!isValidObjectId(video_id)){
        throw new ApiError(400, "Provide Valid Id")
    }
    
    const video = await Video.aggregate([
        { 
            $match: {
                _id: new mongoose.Types.ObjectId(video_id)
            } 
        },
        {
            $lookup:{
                from :"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $lookup:{
                from : "users",
                localField:"owner",
                foreignField:'_id',
                as:"owner",
                pipeline:[
                {
                    $lookup:{
                        from : "subscriptions" ,
                        localField:"id",
                        foreignField:"subscriber",
                        as:"subscribers"
                    },
                    
                },
               { $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{
                                $in:[
                                    req?.user?._id,
                                    "$subscribers.subscriber"
                                ]
                            },
                            then: true,
                            else:false  
                        }
                    }
                 }
                },
                {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                        subscribersCount: 1,
                        isSubscribed: 1
                    }
                }
              ]
            }
        },
        {
            $addFields:{
                likecount:{
                    $size: "$likes"
                },
                owner:{
                    $first:'$owner'
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])


    if(!video){
        throw new ApiError(400,"Video Do not Exist")
    }
    // increment Views
    await Video.findByIdAndUpdate(video_id,{
        $inc:{
            views:1
        }
    })


    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: video_id
        }
    });

    return res
    .status(200)
    .json(new ApiResponse(
        400,
        video[0],
        "Video Fetched"
    ))
})

const updateVideo = asyncHandler(async (req,res)=>{
    const {title,description} = req.body;
    const {video_id} = req.params;

    if(!(title && description)){
        throw new ApiError(401, "Title & Description are required fields")
    } 

    if(!isValidObjectId(video_id)){
        throw new ApiError(401, "Provide Valid Id")
    }


    const video =await Video.findById(video_id);

    if(!video){
        throw new ApiError(401, "No Video Found")
    }

    if(video?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You Can't Edit as you are not the owner of this video");
    }


    const thumbnailLocalPath = req.file?.path;



    if(!thumbnailLocalPath){
        throw new ApiError(401, "Thumbnail is required")
    }

    const oldThumbnail = video.thumbnail.public_id;

    if(!(await deleteFile(oldThumbnail))){
        throw new ApiError(501, "Old File not deleted")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(501, "Thumbnail isn't Uploaded")
    }

    const updatedVideo = await Video.findByIdAndUpdate(video_id,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    )

    if(!updateVideo){
        throw new ApiError(501, "Video Details Can't update")
    }

    if(updatedVideo){
        if(!(await deleteFile(oldThumbnail))){
            throw new ApiError(501, "Old File not deleted")
        }
    }

    return res.status(200).json( new ApiResponse(200,updateVideo,"Upadted Succesfully"))


})

const deleteVideo = asyncHandler(async (req,res)=>{
    const { video_id } = req.params 
    if(!isValidObjectId(video_id)){
        throw new ApiError(400,"Invalid Video id")
    }

    const video = await Video.findById(video_id);
    if(!video){
        throw new ApiError(401,"Video Not Found")
    }

    if((video?.owner.toString() !== req.user._id.toString() )){
        throw new ApiError(401,"You are Not Owner of Video") 
    }

    const deletedVideo = await Video.findByIdAndDelete(video?._id);

    if(!deletedVideo){
        throw new ApiError(501,"Video Not Deleted")
    }

    await deleteFile(video.thumbnail.public_id);
    await deleteFile(video.videoFile.public_id);

    //  // delete video likes
    //  await Like.deleteMany({
    //     video: video_id
    // })

    //  // delete video comments
    // await Comment.deleteMany({
    //     video: video_id
    // })

    return res.status(200).json(new ApiResponse(200,deletedVideo,"Video Deleted Succeffully" ))

})

const togglePublishStatus = asyncHandler(async (req,res)=>{
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid ID")
    }

    const video = await Video.findById(videoId); 
    if(!video){
        throw new ApiError(400, "Can't find Video")
    }
    if(video?.owner.toString() !== req?.user._id.toString()){
        throw new ApiError(400, "You Cant Change Status")
    }


    const updatedStatus =  await Video.findByIdAndUpdate(videoId,{

            $set:{
                isPublished : !video?.isPublished 
            },
            

    },{new:true})

    if(!updatedStatus){
        throw new ApiError(501, "Can't Change Status")
    }

    return res.status(200).json(new ApiResponse(200,{isPublished: updatedStatus.isPublished },"Status updated Successfully" ))
})
 

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    togglePublishStatus,
    deleteVideo
    
}