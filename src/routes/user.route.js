import { Router } from "express";
import {logoutUser, loginUser, registerUser, refreshToken,changePassword } from "../controller/user.controller.js";
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
    router.route('/refreshToken').post(refreshToken)
    router.route('/changePassword').post(verifyJwt,changePassword)

export default router


