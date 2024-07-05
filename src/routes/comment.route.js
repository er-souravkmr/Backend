import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controller/comment.controller.js";

const router = Router();
router.use(verifyJwt)

router.route('/:videoId').get(getVideoComments).post(addComment)
router.route('/c/:commentId').patch(updateComment).delete(deleteComment)

export default router