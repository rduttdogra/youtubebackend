import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError("500", error)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // validation - not empty
    // check user if already exist : username, email se
    // check for images
    //check for avtar
    //upload to cloudnary
    //create user object - create entry in db 
    //remove password and reffresh toekn in response
    // check for user creation 
    //return response

    const { fullName, email, username, password } = req.body

    if ([fullName, email, username, password].some((filed) => filed?.trim() === "")) {
        throw new ApiError("400", "All fileds are required!")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    //console.log(existedUser);

    if (existedUser) {
        throw new ApiError("409", "User aleady existed with email or username")
    }

    //console.log("req.files", req.files);
    //const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let avatarLocalPath = ""
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    let coverImageLocalPath = ""
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError("400", "Avatar Image is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError("400", "Avatar Image is required!")
    }

    const userAdded = await User.create({
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    //    if(userAdded){
    //     console.log("created user", userAdded);
    //    }

    const createdUser = await User.findById(userAdded._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError("500", "Something went wrong while registring the user")
    }

    return res.status(201).json(new ApiResponse("200", createdUser, "User registered successfully."))

});

const loginUser = asyncHandler(async (req, res) => {
    // req body - data
    //check username or email and password
    //find the user
    //password check 
    //access and refresh token
    //send cookies
    console.log(req.body);

    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError("400", "email or username is required")
    }

    if (!password) {
        throw new ApiError("400", "password is required")
    }

    const user = await User.findOne({ 
        $or: [{email}, {username}]
     })

    if (!user) {
        throw new ApiError("404", "User is invalid!")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    console.log("isPasswordCorrect", isPasswordCorrect)

    if (!isPasswordCorrect) {
        throw new ApiError("401", "Incorrect Password!")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(
            "200", 
            {
                user: loggedInUser, refreshToken, accessToken
            }, 
            "Login successfully"
            )
        )
    })


const logoutUser = asyncHandler(async(req, res) => {
    //but the issue is how can we get user ub logout user api so that we need to creare middleware so every time user send request we can check if access token comes then we can verify that access token and then can get user from aceess token and pass user with response. 
    // delete refresh token from database
    //clear cookies

    const user = await User.findByIdAndUpdate(
        req.user._id, 
        { $set: { refreshToken: undefined } }, 
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully"))
}) 


const refreshAccessToken = asyncHandler( async(req, res) => {
   
    const incomingRefreshToken = req.cookies.refreshToken ||  req.body.refreshToken
    console.log("incomingRefreshToken ", incomingRefreshToken);
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFERSH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
        console.log("user ", user);
        console.log("user?.refreshToken ", user?.refreshToken);
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user?._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {refreshToken, accessToken}, "Refresh token generated successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token")
    }


})

export { registerUser, loginUser, logoutUser, refreshAccessToken }