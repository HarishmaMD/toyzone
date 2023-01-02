let dotenv = require('dotenv').config()
const CartModel = require('../models/cart')
const OrdersModel = require('../models/orders')
const Register = require('../models/user')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', // sandbox or live
    // 'client_id': 'AaOJ347rJJ4ByJzjdAHeSh_hwsQYPRAa59-rav9PvHx3tg6_IdCGEH0XW0Fw5rQUFPOkOaihgh9AdjAs',
    // 'client_secret': 'ENJC03gzb_0Uawr298c5y0KfaKA5CK3fvah6xkPEbeT7cqQ3d9Y9yQBWc9-GX6Zmgokz8Y2eclWwPPiV'
    'client_id': 'AcU1CPEMZF8EhPzUei0InE7yaX2wpjgdFEINf9Ll0TiWSk7Gn62CR1RDvXijwhCU5FH-8s6X_UHb4USq',
    'client_secret': 'EH3xg4th5Xh2fAG5U2z8W2KRATMVL2SZGFMojIO_ef5VIKyX8-9RHucQTIfWAOhTtJ8K5B3suSQ9JAJT'
});
var instance = new Razorpay({
    key_id: 'rzp_test_0v5kpboEVcqx5v',
    key_secret: '0RN3VbTPz57AyMmlVlOCVn5n',
});



const userHelper = {
    getUserDetails : async(email)=>{
        const userDetails = await Register.findOne({email: email});
        // const userDetails = await Register.findOne({email: 'sam@gmail.com'});
        return userDetails;
    },
    getUserById : async(userId)=>{
        const userDetails = await Register.findOne({_id: Object(userId)});
        return userDetails;
    },

    getProductPrice: async(productId)=>{
        let product = await ProductsModel.findOne({_id:Object(productId)})
        if(product.productOfferActive){
            let discount = product.productOffer.offerPercentage;
            let price =  (product.price) - (product.price/100)*discount
            console.log('price 35 = ',price);
            return price;
        }
    },

    getTotalCartAmount : async(userId)=>{
        // const userDetails = await Register.findOne({email: req.session.userEmail});

        let cartItems = await CartModel.aggregate([
            {   $match: { userId: userId }  },
            {   $match: { active: true }  },
            {   $unwind: '$products'        },
            {   $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {   $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {   $sort:{ _id : 1 }       }
        ])

        let grandTotal = 0;
        cartItems.forEach(function(item){
            let tqty = item.quantity;
            let tprice =item.products[0].price;
            grandTotal = (tqty*tprice)+grandTotal;
        })

        return grandTotal;
    },
    getAllCartItem : async(userId)=>{
        let cartItems = await CartModel.aggregate([
            {   $match: { userId: userId }  },
            {   $match: { active: true }  },
            {   $unwind: '$products'        },
            {   $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {   $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {   $sort:{ _id : 1 }       }
        ])

        return cartItems;
    },
    getCartCount: async(userId)=>{
        let count = await CartModel.find({userId:userId,active:true}).count()
        return count
    },

    generateRazorpay : (orderId, total) => {

        console.log('generateRazorpay = ',total);
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            }, async (err, order) => {
                console.log('113 = ',err);
                // if(!err){
                //     let codPlaced = await OrdersModel.updateMany({cartId:cartId},{$set :{'status': 'placed',paymentMode:'razorpay',paymentStatus:'payed'}} ,{upsert: true})
                // }

                resolve(order)
            }) 
        })
    },
    
    verifyRazorpay : (details) => {
        console.log('ffhfhfhhf');
        return new Promise((resolve, reject) => {
            console.log('ffhfhfhhf2');
            const crypto = require('crypto')
            console.log('ffhfhfhhf3');
            let hmac = crypto.createHmac('sha256', 'VZi2ME245QK5LoSn9mghKl2P')
            // let hmac = crypto.createHmac('sha256', dotenv.parsed.key_secret)
            console.log('ffhfhfhhf4 = ',details);
            
            // hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
            console.log('ffhfhfhhf6');
            // hmac = hmac.digest('hex')
            // console.log('ddddd = ',details);
            // console.log('hmac = ',hmac);
            // console.log('details = ',details.payment.razorpay_signature);
            // if (hmac == details['payment[razorpay_signature]'])
            // if (hmac == details.payment.razorpay_signature)
            // {
                console.log('resolve');
                resolve()
            // } else {
            //     console.log('reject');
            //     reject()
            // }
    
        })
    },


    // Paypal
    generatePaypal: (grandTotal)=>{
        return new Promise((resolve, reject) => {
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/order-success",
                    "cancel_url": "http://localhost:3000/checkout"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": grandTotal,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": grandTotal
                    },
                    "description": "This is the payment description."
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    console.log("Create Payment Response");
                    console.log(payment, 'payment type');
                    console.log(payment.links[1].href);
                    resolve(payment.links[1].href)
                }
            });
        })
    },
    //wallet
    getWalletAmount : async(userId)=>{
        console.log('86');
        console.log('userId 87 = ',userId);

        let result = await Register.findOne({_id: Object(userId)})
        console.log('90 = ',result);
        if(result.wallet){
            console.log('91 = ',result.wallet);
            return result.wallet
        }else{
            return 0
        }
    },



}

module.exports = userHelper;
