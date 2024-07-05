import Router from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getAllLikedVideo, 
         toggleCommentLike, 
         toggleTweetLike, 
         toggleVideoLikes } from "../controller/like.controller.js";

const router = Router();
router.use(verifyJwt);


router.route("/videos").get(getAllLikedVideo);
router.route("/:videoId").post(toggleVideoLikes);
router.route("/comment/:commentId").post(toggleCommentLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);




export default router;