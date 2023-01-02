const mongoose = require('mongoose');

// mongoose.connect("mongodb://localhost:27017/ecommerce", {
mongoose.connect("mongodb+srv://harishma:harishma123@cluster0.nxask00.mongodb.net/ecommerce", {
    useNewUrlParser:true
} ).then(()=>{
    console.log( 'Connection successful')
}).catch((e)=>{
    console.log(`Error = ${e}`);
})