import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/db.js"

dotenv.config({
    path : './env'
})

const app = express();
app.get("/" , (req,res)=>{
    res.send("<h1>Hello World</h1>")
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log("Server is running on port no:"+ process.env.PORT)
    })
})
.catch((err)=>{
    console.log("ERROR!!! " + err)
})













