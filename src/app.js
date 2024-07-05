import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

//inbuilt body parser
app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended:true,limit : "16kb"}))
app.use(express.static("public"));
app.use(cookieParser());

//Import Routes 
 import userRouter from "./routes/user.route.js"
 import videoRouter from "./routes/video.route.js"
 import likeRouter from "./routes/like.route.js"
 import commentRouter from "./routes/comment.route.js"

 //Router declartion
 app.use("/api/v1/users",userRouter)
 app.use("/api/v1/videos",videoRouter)
 app.use("/api/likes",likeRouter)
 app.use("/api/comments",commentRouter)


export  {app};