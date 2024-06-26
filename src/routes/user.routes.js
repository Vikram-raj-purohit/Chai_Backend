import { Router } from "express";
import { loginUser, refreshAccessToken, registerUser, userLogOut } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from"../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//Secure Routes

router.route("/logout").post(verifyJWT, userLogOut)
router.route("/refresh-token").post(refreshAccessToken)

export default router
