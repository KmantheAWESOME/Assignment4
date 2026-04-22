const mongoose = require('mongoose') // Mongoose is the ODM (Object Data Modeling) library that lets us define schemas and interact with MongoDB using JavaScript objects

// Define the shape and rules for documents in the 'notes' collection
const noteSchema = mongoose.Schema(
  {
    id:Number,
    tier_name:String,
    debug:Number,
    price:Number,
    oneonone:Boolean,
  },

  // ---- Schema Options ----------------------------------------------
  {
    timestamps: true, // Automatically adds and manages `createdAt` and `updatedAt` fields on every document
    //  — no need to set them manually
  }
)

// Compile the schema into a Model and export it.
// Mongoose will map this to a MongoDB collection named 'notes' (lowercased + pluralized automatically).
// Other files import this to query, create, update, or delete notes: e.g. await Note.create({...})
module.exports = mongoose.model('Note', noteSchema, 'codehunting_collection')