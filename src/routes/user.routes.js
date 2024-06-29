import { Router } from "express";
import { 
    changeCurrentPassword, 
    currentUser, 
    getChennalUserProfile, 
    getWatchHistory, 
    loginUser, 
    refreshAccessToken, 
    registerUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    updateUserDetail, 
    userLogOut } from "../controllers/user.controller.js";
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
router.route("/changepassword").post(verifyJWT, changeCurrentPassword)
router.route("/currentuser").get(verifyJWT, currentUser)
router.route("/updateuserdetails").patch(verifyJWT, updateUserDetail)
router.route("/updateuseravatar").patch(verifyJWT, upload.single('avatar'),updateUserAvatar)
router.route("/coverimage").patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getChennalUserProfile)
router.route("/watchhistory").get(verifyJWT, getWatchHistory)


export default router
