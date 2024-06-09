import mongoose from "mongoose";
import { DB_Chai } from "../constants.js";

const connectDB = async()=>{
    try {
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Chai}`)
       console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export default connectDB 