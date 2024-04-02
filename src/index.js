//require('dotenv').config({path: './env'}) // its not looking like module structure
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})

const port = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.error(`Server error: `, err);
    })
    
    app.listen(port, () => {
        console.log(`Server is runing at port: ${port}`);
    })
})
.catch((err) => {
    console.log(`MONGODB connection failed: ${err}`);
})









/*
import express from "express";
const app = express();

//efi function javascript // db connection // connect db always in try catch and use async await to connect database because may time it will take time to connect database.

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.error("error: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is working on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error('error:', error);
        throw error;
    }
})()

*/