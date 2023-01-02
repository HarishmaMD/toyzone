const mongoose = require('mongoose')

const offerCategorySchema = new mongoose.Schema({
   category:{
        type:Object,
        required:false
    },
    categoryTitle : {
        type: String,
        required: false
    },
    start: {
        type: Date,
        required: false
    },
    end: {
        type: Date,
        required: false
    },
    offerPercentage: {
        type : Number,
        required: false
    },
    active: {
        type: Boolean,
        required: false
    }
})



const OfferCategoryModel = new mongoose.model('offerCategory',offerCategorySchema);

module.exports = OfferCategoryModel;