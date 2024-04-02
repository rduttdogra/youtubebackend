import mongoose, {Schema} from "mongoose";

import bcrypt from "bcrypt"
//import { jwt } from "jsonwebtoken";
import jwt from 'jsonwebtoken';

const userScheme = Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            require: true
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            require: [true, "Password is required!"]
        },
        refreshToken: {
            type: String,
        }


    }, 
    {
        timestamps: true
    }
)

userScheme.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userScheme.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userScheme.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ASSESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ASSESS_TOKEN_EXPIRY
        }
    )
}
userScheme.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFERSH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFERSH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userScheme)