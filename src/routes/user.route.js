import { Router } from "express";
import {
    logoutUser, 
    loginUser, 
    registerUser, 
    refreshToken,
    changePassword, 
    getCurrentuser, 
    updateAccountDetails, 
    updateAvatar, 
    updateCover, 
    getUserChannelProfile, 
    getWatchHistory 
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()

    router.route("/register").post(
        upload.fields([             //File Handling by multer
            {
                name:"avatar",
                maxCount:1
            },
            {
                name:"coverImage",
                maxCount:1
            }
        ]) ,        
    registerUser)

    router.route("/login").post(loginUser)
    router.route('/logout').post(verifyJwt,logoutUser)
    router.route('/refresh-token').post(refreshToken)
    router.route('/change-password').post(verifyJwt,changePassword)
    router.route('/current-user').get(verifyJwt,getCurrentuser)
    router.route('/update-account').patch(verifyJwt,updateAccountDetails)
    router.route('/update-avatar').patch(verifyJwt,upload.single("avatar"),updateAvatar)
    router.route('/update-cover').patch(verifyJwt,upload.single("coverImage"),updateCover)
    router.route('/c/:username').get(verifyJwt,getUserChannelProfile)
    router.route('/history').get(verifyJwt,getWatchHistory)

export default router


