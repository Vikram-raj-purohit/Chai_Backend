import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { json } from "express"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        // console.log(refreshToken,accessToken)

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while gerating Access and Refresh Token.')
    }

}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async(req, res)=>{
   
    const {username, email, password} = req.body

    if (!(username  || email)) {
        throw new ApiError(400, "Username and Email are required")
        
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!existingUser) {
        throw new ApiError(404, "User not found")
        
    }
    
    const isPasswordCorrect = await existingUser.isPassword(password)
    
    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Password is incorrect.')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(existingUser._id)
    
    const userLogedIn = await User.findById(existingUser._id).select("-password -refreshToken")

    const options ={
        httpOnly: true,
        secure:true
    }
    

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: userLogedIn, refreshToken, accessToken}, "User logged in successfully"))


})

const userLogOut = asyncHandler(async(req, res)=>{

    

    User.findByIdAndUpdate(
        req.user._id, 
        {
            $unset:{
                    refreshToken:1
    
                    }
                }
                ,{
                    new:true
                }
            )


    const options={
        httpOnly: true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User Log Out successfully."))

})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

    if (!incommingRefreshToken) {
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.eng.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
            }
    
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used.")
        }
        const options = {
            httpOnly: true,
            secure:true
        }
        const {accessToken, newFefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', newFefreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken:newFefreshToken   }, "Refresh Token Generated Successfully."))
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")

    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old Password is incorrect")
        }
        user.password = newPassword
        await user.save({validateBeforeSave:false})
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const currentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200).json(req.user, "Current User details fetched successfully.")

})

const updateUserDetail = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Please provide all the details")

    }
    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {
            new:true
        }

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully."))
    
    

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   
    const localAvatarPath = req.file?.path

    if (!localAvatarPath) {
        throw new ApiError(401, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(localAvatarPath) 
    if (!avatar.url) {
        throw new ApiError(401, "Error while uploading the avatar file")
    }

   const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
                }
        },{
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully."))
    
   
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   
    const localCoverImagePath = req.file?.path

    if (!localCoverImagePath) {
        throw new ApiError(401, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(localCoverImagePath) 
    if (!coverImage.url) {
        throw new ApiError(401, "Error while uploading the cover image file")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
                }
        },{
            new:true
        }
    ).select("-password")
    
   return res
   .status(200)
   .json(new ApiResponse(200, user, "User cover image updated successfully."))

})

const getChennalUserProfile = asyncHandler(async(req, res)=>{
    const {username}  = req.params()

    if (!username?.trim()) {
        throw new ApiError(400, 'Username does not exist')
    }

   const chennal =  await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                    }
            },
            {
                $lookup:{
                    from: "Subscriptions",
                    localField: "_id",
                    foreignField: "chennal",
                    as: "subscripbers"
                }
            },{
                $lookup:{
                    from: "Subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields:{
                    subscripbersCount:{$size:"$subscripbers"},
                    chennalsSubscribedToCount:{$size:"$subscribedTo"},
                    isSubscribed:{$cond:{
                        if:{$in:[req.user?._id, "$subscripbers.subscriber"]},
                        then:true,
                        else:false
                    }}
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscripbersCount: 1,
                    chennalsSubscribedToCount: 1,
                    isSubscribed: 1,
                    email:1

                    }
            }
                
    ]
)
    if (!chennal?.length) {
        throw new ApiError(404, "Chennal does not exist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, chennal[0], 'User chennal fetched successfully.')
    )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        }
        ,
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project: {
                                    fullName: 1,
                                    avatar: 1,
                                    username: 1,
                                    
                                    }
                                    }
                                    ]

                    }
                },
                {
                   $addFields:{
                    owner:{$arrayElemAt:["$owner",0]}
                   }
                }
                        
            ]
        }
    }
    ])

    return res
    .status(200)
    .json( new ApiResponse(200, user[0].watchHistory,'Watch history fetched successfully.'))
})


export {
    registerUser, 
    loginUser,
    userLogOut,
    refreshAccessToken,
    changeCurrentPassword,
    currentUser,
    updateUserDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getChennalUserProfile,
    getWatchHistory


}