
import dotenv from 'dotenv'

import connectDB from "./db/index.js";
import app from './app.js';
dotenv.config({path: "./env"})

connectDB()
.then(
    ()=>{
        app.listen(process.env.PORT || 3000, ()=>{
            console.log(`server is running on Port :${process.env.PORT}`)
        } )
    }
)
.catch((err)=>{
    console.log('Mongo DB connection failed : ', err)
})


/*
import express from 'express';
const app = express();

( async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Chai}`)
        app.on('error', ()=>{
            console.log(Error)
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listioning on port: ${process.env.PORT}`)
        })
    } catch (error) {
        console.error(`Error: ${error}`)
        throw error
    }

} )()
*/