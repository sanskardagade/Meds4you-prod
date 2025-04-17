import express from "express";
import { register, login, getReferredUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);



export default router;
