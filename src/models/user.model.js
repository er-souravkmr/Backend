import mongoose, {Schema, SchemaType } from "mongoose";
import AggregatePaginate from "mongoose-aggregate-paginate-v2";
import  jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";


//Schema off the User Model
const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique: true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique: true,
            lowercase : true,
            trim : true,       
        },
        fullName : {
            type : String,
            required : true,
            trim : true,       
            index:true
        },
        avatar : {  
            type : String, //url
            required : true
        },
        coverImage : {
            type : String, //url
        },
        watchHistory :[
            {
                type : Schema.Types.ObjectId,
                ref:"Video"
            }
        ],    
        password:{
            type:String,
            required : [true,'Password is Required']
        },
        refreshToken:{
                type:String
        }

    },{timestamps:true}
)

userSchema.plugin(AggregatePaginate)

// Making Has of password using bcrypt before saving it to db 
userSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

//Used to compare passed password with the password saved in db using bcrypt
userSchema.methods.isPasswordCorrect =  async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
}



export const User = mongoose.model("User" , userSchema);