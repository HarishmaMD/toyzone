const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    email:{
        type: String,
        required:false
    },
    password:{
        type: String,
        required:false
    }
})


// Create a collection
const AdminModel = new mongoose.model('admin',adminSchema);

module.exports = AdminModel;