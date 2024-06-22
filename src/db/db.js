import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {   
    try {
      const DBConnection =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      console.log(`/n MongoDB Connetced !! DB HOST ${DBConnection.connection.host}`);
    } catch (error) {
        console.error("Error:",error)
        process.exit(1)
    }
}

export default connectDB;