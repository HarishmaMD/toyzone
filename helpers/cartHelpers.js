const CartModel = require('../models/cart')
const Cart = require('../models/cart')
const ObjectId = require('mongoose').Types.ObjectId


const cartHealpers = {
    
    getCartProduct : (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await CartModel.aggregate([
                {
                    $match: { userId: userId },
                    $match: { active: true }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                }
                
            ])
           

            resolve(cartItems)
        })
         
    }
    
  
}



module.exports = cartHealpers;