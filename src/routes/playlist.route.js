import Router from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controller/playlist.controller.js";


const router = Router()
router.use(verifyJwt)


router.route("/create").post(createPlaylist)
router.route("/:playlistId").patch(updatePlaylist).delete(deletePlaylist).get(getPlaylistById)
router.route("/add/:playlistId/:videoId").post(addVideoToPlaylist)
router.route("/remove/:playlistId/:videoId").post(removeVideoFromPlaylist)
router.route("/user/:userId").post(getUserPlaylist)

export default router;