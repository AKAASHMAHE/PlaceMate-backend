import express from "express";
import { getJitsiToken } from "../controllers/jitsiController.js";

const router = express.Router();

router.get("/token", getJitsiToken);

export default router;
