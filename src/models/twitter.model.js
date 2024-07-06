import mongoose,{Schema} from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2";



const twitterSchema = new Schema(
    {
        owner:{
            type : Schema.Types.ObjectId,
            ref:'User'
        },
        content:{
            type:String,
            required :true
        }


    },{timestamps:true}
)

twitterSchema.plugin(AggregatePaginate)

export const Tweet = mongoose.model('Tweet',twitterSchema)