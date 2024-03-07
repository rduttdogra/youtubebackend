import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Mongodb connected !!DB HOST!! ${connectionInstance.connection.host}`);
        console.log(`\n Mongodb connected ${connectionInstance}`);
        
    } catch (error) {
        console.error("MONGODB connection failed: ", error);
        process.exit(1); //learn process exit and codes
    }

}

export default connectDB