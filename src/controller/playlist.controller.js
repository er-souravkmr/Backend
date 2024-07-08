import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,description} = req.body;
    if(!name || !description){
        throw new ApiError(401,"Name & description both are required")
    }

    const playlist = await Playlist.create(
      {
        name,
        description,
        owner : req.user?._id
      }
    )

    if(!playlist){
        throw new ApiError(501,"Failed to Create")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Created Successfully"
        )
    )
});

const updatePlaylist = asyncHandler(async (req,res)=>{
    const  {name,description} = req.body;
    const {playlistId} = req.params;

    if(!name || !description){
        throw new ApiError(401,"Required Fields")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(401,"Invalid Playlist Id")
    }

    const playlistCheck = await Playlist.findById(playlistId);
    if(!playlistCheck){
        throw new ApiError(401,"Playlist not Found")
    }

    if(playlistCheck.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401,"Anautherized Action , Can't Update")
    } 

    const playlist = await Playlist.findByIdAndUpdate(
        playlistCheck?._id,
        {
            $set:{
                name,
                description
            }
        },
        {new:true}
    )
    if(!playlist){
        throw new ApiError(501,"Failed to Update PlayList, Please Try Again")
    }

    return res.status(200).json(
        new ApiResponse(200,{playlist},"Playlist Updated Successfully")
    )

})

const deletePlaylist = asyncHandler(async (req,res)=>{
    const {playlistId} = req.params;
    if(! isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid Id")
    }

    const playlistCheck = await Playlist.findById(playlistId);
    if(!playlistCheck){
        throw new ApiError(401,"Playlist not Found")
    }

    if(playlistCheck.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401,"Anautherized Action , Can't Delete")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistCheck?._id);

    if(!playlist){
        throw new ApiError(401,"Failed to Delete , Try again Later")
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Deleted Successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req,res)=>{
    const {playlistId,videoId} = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId) ){
        throw new ApiError(401, "Invalid Request")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(401, "Playlist not Found")
    }
    if(!video){
        throw new ApiError(401, "Video not Found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "Only Owner can add video to Playlist")
    }    

    const videoInPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet:{
                videos : videoId
            }
        },
        {new:true}
    )

    if(!videoInPlaylist){
        throw new ApiError(501,"Failed to add, try Again Later")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoInPlaylist,
                "Added video to playlist successfully"
            )
    );

})

const removeVideoFromPlaylist = asyncHandler(async (req,res)=>{
    const {playlistId,videoId} = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId) ){
        throw new ApiError(401, "Invalid Request")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(401, "Playlist not Found")
    }
    if(!video){
        throw new ApiError(401, "Video not Found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "Only Owner can add video to Playlist")
    }    

    const videoInPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $pull:{
                videos : videoId
            }
        },
        {new:true}
    )

    if(!videoInPlaylist){
        throw new ApiError(501,"Failed to Remove, try Again Later")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoInPlaylist,
                "Removed video from playlist successfully"
            )
    );
})

const getPlaylistById = asyncHandler(async (req,res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid Request")
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(401, "PlayList Not found")
    }

    const aggregatePlaylist = await Playlist.aggregate([
        {
            $match : {
                _id : playlist?._id
            }
        },
        {
            $lookup:{
                from : "videos",
                localField:"videos",
                foreignField:"_id",
                as: "videos"
            }
        },
        {
            $lookup:{
                from : "users",
                localField:"owner",
                foreignField:"_id",
                as: "ownerDetails"
            }
        },
        {
            $match:{
                "videos.isPublished" :true
            }
        },
        {
            $addFields:{
                totalVideo:{
                    $size : '$videos'
                },
                totalViews:{
                   $sum : "$videos.view" 
                },
                
                owner:{
                    $first : "$ownerDetails"
                }
                
            }
        },
        {
            $project: {
                name:1,
                description:1,
                createdAt:1,
                updatedAt:1,
                totalVideo:1,
                totalViews:1,
                video:{
                    _id:1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    if(!aggregatePlaylist){
        throw new ApiError(501, "Cant Find PlayList")
    }

    return res.status(200).json(new ApiResponse(
        200,
        aggregatePlaylist,
        "PlayList Fetched"
    ))

})


const getUserPlaylist = asyncHandler(async (req,res)=>{
    const {userId} =req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(401, "Invalid Request")
    }

    const playlist = await Playlist.aggregate([
        {
            $match : {
                owner : req.user?._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }

    ])

    if(!playlist){
        throw new ApiError(501, "faild to find , Try again")
    }

    return res.status(200).json(new ApiResponse(
        200,
        playlist,
        "PlayList Fetched"
    ))


})


export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylist
}