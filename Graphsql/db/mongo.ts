import mongoose from "mongoose"
import {Pet} from "../main.ts"
const Schema = mongoose.Schema;

const Schemapet= new Schema({
    name: {type: String, unique:true, required:true },
    breed: {type: String, required: true}
})

export type PetModelType= mongoose.Document & Pet

export const PetModel= mongoose.model<PetModelType>("Pet", Schemapet);