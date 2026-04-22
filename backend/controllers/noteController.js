 
const asyncHandler = require('express-async-handler')
 
const Note = require('../model/noteModel')
const User = require('../model/userModel') // for update and delete

// http://localhost:5555/api/notes/
const getNotes = asyncHandler(async (req, res) =>{
  
  
    const notes = await Note.find({user:req.user.id})
 
    res.status(200).json(notes)
})

// ===== CREATE A NOTE =====
const setNote = asyncHandler(async(req, res) => {

    // Validate that the request body contains a 'text' field 
    //  without this check, we'd save empty/useless notes to the database
    if(!req.body.text){
        // Set status to 400 (Bad Request) 
        //  tells the client they sent invalid data
        res.status(400)
        // Throw an error with a helpful message 
        //  asyncHandler catches this and passes it to our errorMiddleware
        throw new  Error("Please add a 'text' field. ")
    }


    // Insert a new note document into MongoDB 
    //  .create() both builds and saves the document in one step
    const note_created = await Note.create(
        {
            // Set the text field to whatever the client sent in the request body
            text: req.body.text,
            user: req.user.id // adding which user created the note
            
        }
    )

    // Send back the newly created note as JSON 
    //  the client gets confirmation of what was saved, 
    // including the auto-generated _id
    res.status(200).json(note_created)
})

// ===== UPDATE A NOTE =====
const updateNote =  asyncHandler(async(req, res) => {

    // if we need to update any note - we need an id
    // Look up the note by the id from the URL parameter (e.g., /api/notes/abc123) 
    //  we first check if it exists before trying to update
    const note = await Note.findById(req.params.id) // this will find our note

    // If no note was found with that id, send a 400 error 
    //  prevents updating a non-existent document
    if(!note){
        res.status(400)
        throw new Error("Note not found")
    }

    //-------Only authorized user can update their note---------------
    const user = await User.findById(req.user.id)
    // we want to check if useer exist or not, if yes then they can only update and delete their notes
    if(!user){
        res.status(401)
        throw new Error(' user not found')
    }

    // Only the notes that belong to the user should be modified by that user.
    if (note.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
     }

    //--------------------------------------------


    // now lets update the note 
    // Find the note by id and update its text field in one operation
    const updatedNote = await Note.findByIdAndUpdate(
        req.params.id,          // which note to update
        {text: req.body.text},  // the new data to apply
        {new: true}             // return the updated document instead of the old one 
        //  without this, Mongoose returns the document as it was BEFORE the update
    )

    // Send back the updated note so the client can see the changes took effect
    res.status(200).json(updatedNote)
})

// ===== DELETE A NOTE =====
const deleteNote = asyncHandler(async (req, res) => {

    // Find the note first 
    //  we need the document object to call .deleteOne() on it
    const note = await Note.findById(req.params.id) // this will find our note

    // If the note doesn't exist, tell the client 
    //  prevents trying to delete something that's already gone
    if(!note){
        res.status(400)
        throw new Error("Note not found")
    }


    //-------Only authorized user can update their note ---------------
    const user = await User.findById(req.user.id)
    // we want to check if useer exist or not, if yes then they can only update and delete their notes
    if(!user){
        res.status(401)
        throw new Error(' user not found')
    }

    // check if the note has the user field, because we are adding the user key in the database
    if (note.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
     }

    //--------------------------------

    // Remove the note from the database 
    //  .deleteOne() is called on the document instance we found above
    await note.deleteOne()

    // Send back a confirmation message with the deleted note's id 
    //  lets the client know which note was removed
    res.status(200).json({ message: `Delete note ${req.params.id}` })
}
)

// Export all four functions so noteRoutes.js can attach them to the corresponding HTTP endpoints
module.exports = {
    getNotes,
    setNote,
    updateNote,
    deleteNote
}