import mongoose , {Schema} from "mongoose";

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

export const Subscription = mongoose.model("Subscription",subsSchema)