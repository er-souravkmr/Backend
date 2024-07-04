import mongoose, { Schema, SchemaType } from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            type: {
                url: String,
                public_id: String,
            },
            required : true
        },
        thumbnail : {
            type: {
                url: String,
                public_id: String,
            },
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
        owner : {
            type : Schema.Types.ObjectId, 
            ref : "User"
        },

    },{timestamps:true}
)

videoSchema.plugin(AggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema);