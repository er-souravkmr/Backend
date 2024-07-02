import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware";
import { getAllVideos, publishAVideo } from "../controller/video.controller";

const router = Router();
router.use(verifyJwt) //Aplly VerifyJwt to all routes in  this file

Router.route('/publish').get(getAllVideos).post(
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




export default router;