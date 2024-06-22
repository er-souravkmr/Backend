import mongoose, { Schema, SchemaType } from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            type : String, //url
            required : true
        },
        thumbnail : {
            type : String, //url
            required : true
        },
        title : {
            type : String, 
            required : true
        },
        description : {
            type : String, 
            required : true
        },
        duration : {
            type : Number, 
            required : true
        },
        views : {
            type : Number, 
            default : 0
        },
        isPublished : {
            type : Boolean, 
            default : true
        },
        Owner : {
            type : Schema.Types.ObjectId, 
            ref : "User"
        },

    },{timestamps:true}
)

videoSchema.plugin(AggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema);