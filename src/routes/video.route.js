import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { deleteVideo, 
         getAllVideos, 
         getVideoById, 
         publishAVideo, 
         togglePublishStatus, 
         updateVideo 
       } from "../controller/video.controller.js";

const router = Router();
router.use(verifyJwt) //Aplly VerifyJwt to all routes in  this file

router.route('/').get(getAllVideos).post(
    upload.fields([
        {
            name : 'videoFile',
            maxCount:1,
        },
        {
            name:'thumbnail',
            maxCount:1,
        }
    ]),

    publishAVideo
)

router.route('/video/:video_id')
.get(getVideoById)
.patch(upload.single("thumbnailLocalPath"),updateVideo)
.delete(deleteVideo);

router.route("/togglestatus/:videoId").patch(togglePublishStatus);







export default router;