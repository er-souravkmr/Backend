import Router from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controller/subscription.controller.js";


const router = Router()
router.use(verifyJwt)


router.route("/toggle/:channelId").post(toggleSubscription)
router.route("/user/:channelId").post(getUserChannelSubscribers)
router.route("/subs/:subscriberId").post(getSubscribedChannels)


export default router;