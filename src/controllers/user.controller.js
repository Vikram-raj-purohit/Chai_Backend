import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {resHandler} from "../utils/resHandler.js"

const registerUser = asyncHandler(async(req,res)=>{
    const {username, email, fullname, password} = req.body
    if([username, email, fullname, password].some((field) => field?.trim()==="" )){
        throw new ApiError(400,"All fields are required.")

    }

    const existedUser = User.findOne({$or: [{ email }, { username }]})
    if(existedUser){
        throw new ApiError(409,"User already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverimageLocalPath = req.files?.coverimage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)
    
    if (!avatar) {
        throw new ApiError(400, "Avatar is not uploaded.")
    }

    const user = await User.create({
        username:username.toLowerCase(),
        email,
        fullname,
        password,
        avatar:avatar.secure_url,
        coverimage:coverimage?.secure_url ||  "" ,
        
    })


    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while creating User.')
    }

    return res.status(200).json(
        new resHandler(200, createdUser, "User Registered successfully.")
    )
})

export {registerUser}