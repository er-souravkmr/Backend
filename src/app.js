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
 import tweetRouter from "./routes/tweet.route.js"
 import playlistRouter from "./routes/playlist.route.js"
 import subsRouter from "./routes/subscription.route.js"
 import health from "./routes/healthcheck.route.js"
 import dashboard from "./routes/dashboard.route.js"

 //Router declartion
 app.use("/api/v1/users",userRouter)
 app.use("/api/v1/videos",videoRouter)
 app.use("/api/v1/likes",likeRouter)
 app.use("/api/v1/comments",commentRouter)
 app.use("/api/v1/tweets",tweetRouter)
 app.use("/api/v1/playlist",playlistRouter)
 app.use("/api/v1/subscription",subsRouter)
 app.use("/api/v1/health",health)
 app.use("/api/v1/dashboard",dashboard)


export  {app};