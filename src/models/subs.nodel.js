import mongoose , {Schema} from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2";

const subsSchema = new Schema(
    {
        subscribers:{
            types: Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            types: Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

subsSchema.plugin(AggregatePaginate)

export const Subscription = mongoose.model("Subscription",subsSchema)