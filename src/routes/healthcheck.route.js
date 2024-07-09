import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { healthCheck } from "../controller/healthcheck.conroller.js";

const router = Router();
router.use(verifyJwt);

router.route("/healthcheck").get(healthCheck);

export default router;