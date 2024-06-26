import mongoose, {Schema} from "mongoose";
import { User } from "./user.model.js";   

const subscriptionSchema = new Schema({

    subscriber:{
        type:  Schema.Types.ObjectId,
        ref:   "User"  //one who subscribing
    },
    chennal:{
        type:  Schema.Types.ObjectId,
        ref:   "User"  //one who subscriber is subscribing
    }

},{
    timestamps: true
})

export const subscription = mongoose.model("Subscription", subscriptionSchema)