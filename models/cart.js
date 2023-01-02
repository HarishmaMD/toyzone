const mongoose = require('mongoose')    

const cartSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:false
    },
    products: {
        type: Array,
        required: false
    },
    active:{
        type: Boolean,
        required: false
    }

})

const CartModel = new mongoose.model('cart',cartSchema);

module.exports = CartModel;

