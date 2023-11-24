import {ApolloServer} from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"
import { GraphQLError } from "graphql";
import { graphql } from "graphql";
import mongoose from "mongoose"
import { PetModel, PetModelType } from "./db/mongo.ts";
import { load } from "https://deno.land/std@0.204.0/dotenv/mod.ts";

const env = await load();
let MONGO_URL = Deno.env.get("MONGO_URL") || env.MONGO_URL

if (!MONGO_URL) {
  console.log("No mongo URL found");
  MONGO_URL="mongodb+srv://jmviajero:12345@cluster0.mfoc843.mongodb.net/Pet?retryWrites=true&w=majority"
}

await mongoose.connect(MONGO_URL);

export type Pet={
  id: string
  name:string;
  breed:string;
}

//cadena de texto normal

const gplSchema = `#graphql
  type Pet{
    id:ID! #obligatorio con !
    name: String!
    breed: String!
  }

  type Query{
    pet_breed(breed: String!): [Pet!]
    pet: [Pet!]!
  }

  type Mutation{
    addPet(name: String!, breed: String!): Pet!
    deletePet(id:ID!): Pet!
    updatePet(id:ID!,name: String!, breed: String!): Pet!
  }


`;

const convertirModelo = (pet: PetModelType): Pet => {
  return {
    id: pet._id.toString(), // Asegúrate de convertir el _id a string si es de tipo ObjectId
    name: pet.name,
    breed: pet.breed,
  };
};

const Query= {
  pet_breed: async (_:unknown, args: {breed:string}) =>{
    const pet= await (PetModel.find({breed: args.breed}).exec())
    if(!pet){
      throw new GraphQLError ("Pet no encontrado")
    }
    const p=pet.map(convertirModelo);
    return p;
  },

  pet: async (_:unknown)=>{
    const pet= await PetModel.find().exec()
    
    if (!pet) {
      throw new GraphQLError ("no encontrado")
    }
    
    const p= pet.map(convertirModelo);
    return p;

  }
}
const Mutation={
  addPet: async (
    _:unknown,
    args: {name:string; breed:string},
  ): Promise<Pet> =>{
    const {name, breed}= args

    const a= new PetModel({
      name,
      breed
    })

    await a.save()
    const pe= convertirModelo(a)
    return pe;
  },

  deletePet: async (
    _:unknown,
    args: {id:string},
  ): Promise<Pet> =>{
    const pet= await PetModel.findById({_id:args.id})
    if(!pet){
      throw new GraphQLError ("Pet no existe")
    }
    await PetModel.findOneAndDelete({_id:args.id})
    return pet;
  },

  updatePet: async (
    _:unknown,
    args: {id: string, name: string, breer: string},
  ): Promise<Pet> =>{
    const {id, name, breer}= args;

    const pet= await PetModel.findByIdAndUpdate({_id: id},{
      name: name,
      breer: breer
    }, {new: true})

    if(!pet){
      throw new GraphQLError("No se ha encontardi la Mascota")
    }


    const p= convertirModelo(pet)
    return p


  }

}





const server= new ApolloServer({
  typeDefs: gplSchema,
  resolvers:{
    Query,
    Mutation,
  }
});

const {url} = await startStandaloneServer(server, {
  listen: {
    port: 3000,
  }
});

console.info("Server is listening if you ask at "+ url)
