const express = require('express')
const UsersModel = require('../models/user')
const bcrypt = require('bcrypt')
const session = require('express-session')
const Register = require('../models/user')
const ProductsModel = require('../models/product')
const OrdersModel = require('../models/orders')
const CartModel = require('../models/cart')
const AddressModel = require('../models/address')
const CategoryModel = require('../models/category')
const CouponModel = require('../models/couponModel')
const BannersModel = require('../models/banner');
const { ObjectId, ObjectID } = require('mongodb')
const cartHealper = require('../helpers/cartHelpers')
const userHelper = require('../helpers/userHelpers')
const moment = require("moment")

let dotenv = require('dotenv').config()
// const client = require('twilio')('AC2f0f05a277bd71b4d24b1886868dd3b0', '573c8be5361958c0d335000d31fdcd27');
const client = require('twilio')(dotenv.parsed.accountSid, dotenv.parsed.authToken);

var minm = 10000;
var maxm = 99999;
let otp = Math.floor(Math.random() * (maxm - minm + 1)) + minm;


const app = express()
const userController = {
    homeView: async (req, res,next) => {
        console.log('25');
        try {
            req.session.previousUrl = '/'
            res.locals.pageTitle = 'home'

            let cartCount = 0;
            const categories = await CategoryModel.find({});
        const products = await ProductsModel.find({}).sort({ _id: -1 })
        const banners = await BannersModel.find({}).sort({ _id: -1 })

        res.render('users/index', { categories, products, banners })
    } catch (error) {
        res.render('layouts/somethingWentWrong')
    }
    },
    errorview:(req,res)=>{
        res.render('users/404')
    },
    loginView: (req, res, next) => {
        console.log('ssssd = ',req.session.previousUrl);
        
        res.render('users/login')
    },
    loginGet: (req, res) => {
        console.log('loginGet prev = ',req.session.previousUrl);
        
        res.render('users/login')
    },
    otpLoginGet: (req,res)=>{
        res.render('users/otp-login')
    },
    otpLoginPost : async(req,res)=>{

        const userDetails = await Register.findOne({phone: req.body.phone});
        const toPhno = '+91'+req.body.phone;

        console.log('otp = '+otp);
        console.log('reg = ',userDetails);
        console.log('gave = ',toPhno);

        if(userDetails!=null)
        {
            console.log('52');
            client.messages.create({
                body: 'your otp is '+otp,
                from: '+19788506937',
                to: toPhno
            })
            .then(message => console.log(message.sid));
            console.log('59');
            // res.redirect('/otp-login')
            res.render('users/otp-login',{userDetails})
        }
        else{
            res.render('users/login',{otpError: true, msg: 'Phone Number does not exist'})
        }
    },
    otpVerifyPost : async (req,res)=>{

        if(otp == req.body.otp){
            req.session.userEmail = req.body.email;
            req.session.loggedIn = true;
            req.session.admin = false;
            res.redirect('/')
        }else{
            res.render('users/otp-login',{error:true,msg:'Invalid Otp'})
        }

    },
    loginPost: async (req, res, next) => {
        const email = req.body.email;

        const password = req.body.password;

        const userDetails = await Register.findOne({ email: email });
        console.log('ssss = ',req.session.previousUrl);


        if (userDetails == null) {
            res.render('users/login', { error: true, msg: 'Invalid email or password' });

        } else {
            try {

                if (await bcrypt.compare(password, userDetails.password)) {

                    if (userDetails.active == false) {
                        res.render('users/login', { error: true, msg: 'You are Blocked' });
                    }

                    req.session.userEmail = req.body.email;
                    req.session.loggedIn = true;

                    if (userDetails.email == 'admin@gmail.com') {
                        req.session.admin = true;
                        res.redirect('admin')
                    }
                    else {
                        req.session.admin = false;
                        // res.redirect('/')
                        console.log('req.session.previousUrl= ',req.session.previousUrl);
                        if(req.session.previousUrl != undefined) res.redirect(req.session.previousUrl)
                        else res.redirect('/')
                    }
                } else {
                    res.render('users/login', { error: true, msg: 'Invalid email or password' });
                }
            } catch (error) {
                console.log("error occured")
                res.render('404')
            }
        }
    },

    logout: (req, res) => {

        req.session.destroy((err) => {
            if (err) console.log(err)
            else res.redirect('/')
        })
    },
    signupGet: (req, res) => {
        res.render('users/signup')

    },
    signupPost: async (req, res, next) => {
        try {

            const password = req.body.password;
            const confirmPassword = req.body.cpassword;
            const userDetails = await UsersModel.find({ email: req.body.email });
            const count = await UsersModel.find({ email: req.body.email }).count();
            if (count != 0) {
                res.render('users/signup', { error: true, msg: 'Email already Exists!' })
            }
            else {

                if (password == confirmPassword) {

                    const passwordHashed = await bcrypt.hash(password, 10)
                    const registerEmployee = new UsersModel({
                        name: req.body.name,
                        email: req.body.email,
                        phone: req.body.phone,
                        wallet: 0,
                        password: passwordHashed
                    })
                    const registered = await registerEmployee.save();
                    req.session.userEmail = req.body.email;
                    req.session.loggedIn = true;
                    req.session.admin = false;

                    req.session.user = await Register.findOne({ email: req.body.email })
                    res.status(201).redirect('/')
                }
                else {
                    res.render('users/signup', { error: true, msg: 'Password does not match' })
                }
            }
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }

    },

    viewProductsGet: async (req, res) => {
        req.session.previousUrl = '/products'
        res.locals.pageTitle = 'products'
        try{
        const products = await ProductsModel.find({}).sort({ _id: -1 })
        res.render('users/view-products', { products })
        }catch(error){
            res.redirect('/')
        }
    },

 
singleProGet:async(req,res)=>{
    let prdtId = req.query.id;
    console.log('prd = ',prdtId);
    req.session.previousUrl = '/single-product?id='+prdtId;
    console.log('reqq = ',req.session.previousUrl);
     try {
        
        var cartExistCheck;
        let addedToCart = false;
        if (req.session.userEmail) {
                const userDetails = await Register.findOne({email: req.session.userEmail});
                cartExistCheck = await CartModel.findOne({userId: userDetails._id.valueOf(),active: true ,'products.item':ObjectId(prdtId)})
                console.log('cart Exist = ',cartExistCheck);
        }
        if(cartExistCheck!=null){
            addedToCart = true;
        }
        const products = await ProductsModel.findOne({_id: prdtId})

        res.render('users/single-product',{products,addedToCart})
    } catch (error) {
        res.redirect('view-products')
    }
},

//view based on category

musicalView : async(req,res)=>{
    req.session.previousUrl = '/musical'
   

    try {
        const products = await ProductsModel.find({categoryTitle:'Musical toys'}).sort({_id:-1})
        const categories = await CategoryModel.find({})

        res.render('users/musical',{products,categories})
    } catch (error) {
        res.redirect('/')
    }
},
softView : async(req,res)=>{
    req.session.previousUrl = '/soft'
   

    try {
        const categories = await CategoryModel.find({})
        console.log('catt = ',categories);
        const products = await ProductsModel.find({categoryTitle:'Soft toys'}).sort({_id:-1})
        res.render('users/soft',{products,categories})
    } catch (error) {
        res.redirect('/')
    }
},

educationalView : async(req,res)=>{
    req.session.previousUrl = '/educational'
   

    try {
        const categories = await CategoryModel.find({})

        console.log('catt = ',categories);
        const products = await ProductsModel.find({categoryTitle:'Educational toys'}).sort({_id:-1})
        res.render('users/edducational',{products,categories})
    } catch (error) {
        res.redirect('/')
    }
},
    //cart
cartGet: async(req,res)=>{
   
        let prdtId = req.query.id;
        var cartExistCheck;
        let addedToCart = false;
        if (req.session.userEmail) {
                const userDetails = await Register.findOne({email: req.session.userEmail});
                cartExistCheck = await CartModel.findOne({userId: userDetails._id.valueOf(),active: true ,'products.item':ObjectId(prdtId)})

        }
        if(cartExistCheck!=null){
            addedToCart = true;
        }
        const products = await ProductsModel.findOne({_id: prdtId})
        res.render('users/cart',{products,addedToCart}) 
},
// viewCart: async(req,res)=>{

//     try {
//         const userDetails = await Register.findOne({email: req.session.userEmail});
//         let userId = userDetails._id.valueOf()
       
//         let cartItems = await CartModel.aggregate([
//             {   $match: { userId: userId }  },
//             {   $match: { active: true }  },
//             {   $unwind: '$products'        },
//             {   $project: {
//                     item: '$products.item',
//                     quantity: '$products.quantity'
//                 }
//             },
//             {   $lookup: {
//                     from: 'products',
//                     localField: 'item',
//                     foreignField: '_id',
//                     as: 'products'
//                 }
//             },
//             {   $sort:{ _id : 1 }       }
//         ])


    

//         if(cartItems.length < 1){
//             res.render('users/cart',{cartEmpty:true})
            
//         }
//         else{
//             res.render('users/cart',{cartItems,userId})
//         }

//     } catch (error) {
        
//         res.redirect('404')
//     }
viewCart: async (req, res) => {
    req.session.previousUrl = '/cart'
    res.locals.pageTitle = 'cart'

    try {
        const userDetails = await Register.findOne({ email: req.session.userEmail });
        let userId = userDetails._id.valueOf()
        // let userId = '6360a2eea72cffca128104bf'


        let cartItems = await CartModel.aggregate([
            { $match: { userId: userId } },
            { $match: { active: true } },
            { $unwind: '$products' },
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
            },
            { $sort: { _id: 1 } }
        ])

        if (cartItems.length < 1) {
            res.render('users/cart', { cartEmpty: true })
        }
        else {
            console.log('367 - ',cartItems);
            res.render('users/cart', { cartItems, userId })
        }

    } catch (error) {
        // res.redirect('/login')
        res.render('layouts/somethingWentWrong')
    }
            
},
addToCartPost:  async(req,res)=>{

            try {
                console.log('session = ',req.session);
            console.log('sessionEmail = ',req.session.userEmail);
            const userDetails = await Register.findOne({email: req.session.userEmail});

            let pid = ObjectId(req.body.productId)
           
            let prdts={
                item : pid,
                quantity : parseInt(req.body.quantity)
            }
        
            const check = await CartModel.findOne({userId: userDetails._id.valueOf(),active: true})
        
            if(check){
              
                console.log('userDetails._id',userDetails._id.valueOf());
                const resu = await CartModel.updateOne({userId: userDetails._id.valueOf(),active: true}, {$push: {products: prdts}});
                console.log(resu);
            }
            else{
                const cart = new CartModel({
                    userId : userDetails._id,
                    products: prdts,
                    active: true
                }) 
                const result = await cart.save();
            }

            
    
            res.status(200).send({response: true,success: true})
        
    } catch (error) {
        res.redirect('404')
    }
    
},
changePrdtQty: async(req,res)=>{
   

    try {
        let productId = req.body.product;
        let userId = req.body.userId;
        let count = req.body.count;
        let quantity = req.body.qty;
     
        let removeProduct = false;
        if(count==-1 && quantity==1){
           
            const cart = await CartModel.updateOne({userId: userId,active: true},{$pull : {'products':{item: ObjectId(productId)}}})
           
            res.json({quantity: parseInt(quantity)-1,removeProduct:true})
        }
        else{
            console.log('313');
            const cart = await CartModel.findOneAndUpdate({userId: userId,active: true, 'products.item': ObjectId(productId)},{$inc: {'products.$.quantity':parseInt(count)}})
            // const cart = await CartModel.findOneAndUpdate({userId: userId, 'products.item': ObjectId(productId)},{$inc: {'products.$.quantity':parseInt(count)}})
            console.log('313 ' ,cart);


            if(count==1)          res.json({quantity: parseInt(quantity)+1,removeProduct: false});
            else if(count==-1)    res.json({quantity: parseInt(quantity)-1,removeProduct: false})
           

        }
        
    } catch (error) {
       
        res.status(400).send({success:false,message: error.message})
    }
},
removeFromCart : async(req,res)=>{
   
    try {
        let productId = req.body.product;
        let userId = req.body.userId;
        const cart = await CartModel.updateOne({userId: userId,active: true},{$pull : {'products':{item: ObjectId(productId)}}})
       
        res.status(200).send({success:true,message: 'Success'})

    } catch (error) {
        res.status(400).send({success:false,message: error.message})
    }
},
// checkoutGet : async(req,res)=>{
//     req.session.previousUrl = '/checkout'
//     console.log('342');
//      try {
//         const userDetails = await Register.findOne({email: req.session.userEmail}); 
//         console.log(userDetails);
//         let userId = userDetails._id.valueOf()   
//         let cartItems = await CartModel.aggregate([
//             {   $match: { userId: userId }  },
//             {   $match: { active: true }  },
//             {   $unwind: '$products'        },
//             {   $project: {
//                     item: '$products.item',
//                     quantity: '$products.quantity'
//                 }
//             },
//             {   $lookup: {
//                     from: 'products',
//                     localField: 'item',
//                     foreignField: '_id',
//                     as: 'products'
//                 }
//             },
//             {   $sort:{ _id : 1 }       }
//         ])
//         console.log('365');

//         console.log('uid = ',userId);
//         let addresses = await AddressModel.findOne({userId: ObjectId(userId)})
//         let grandTotal = await userHelper.getTotalCartAmount(userId); 
//         console.log('grand total = ',grandTotal);
//         console.log('addresses = ',addresses);
//         if(cartItems.length < 1){
//             res.render('users/cart',{cartEmpty:true})
            
//         }
//         else{
//             res.render('users/checkout2',{cartItems,userId,grandTotal,addresses})
//         }

//     } catch (error) {
//         res.redirect('404')
//     }
 
// },
checkoutGet2 : async(req,res)=>{
    req.session.previousUrl = '/checkout'
    console.log('342');
    //  try {
        let userId = userDetails._id.valueOf() 
        const userDetails = await Register.findOne({email: req.session.userEmail}); 
        console.log(userDetails);
  
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
        console.log('365');

        console.log('uid = ',userId);
        let addresses = await AddressModel.findOne({userId: ObjectId(userId)})
        let grandTotal = await userHelper.getTotalCartAmount(userId); 
        let wallet = await userHelper.getWalletAmount()

        console.log('grand total = ',grandTotal);
        console.log('addresses = ',addresses);
        if(cartItems.length < 1){
            res.render('users/cart',{cartEmpty:true})
            
        }
        else{
            res.render('users/checkout2',{cartItems,userId,grandTotal,addresses})
        }

    // } catch (error) {
    //     res.redirect('404')
    // }
 
},
checkoutPost: async(req,res)=>{
    console.log('431 ');
    console.log(req.body);
    // try {
        const userDetails = await Register.findOne({email: req.session.userEmail}); 
        let userId = userDetails._id.valueOf()
        console.log("561",userId)
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
        console.log('455');
        let addresses = await AddressModel.find({userId: ObjectId(userId)})
        let grandTotal = req.body.grandTotal;
        let coupon = req.body.coupon;
        let discount = req.body.discount;
      
        let wallet = await userHelper.getWalletAmount(userId)
        console.log(wallet)
        if(cartItems.length < 1){
            res.render('users/cart',{cartEmpty:true})
        }
        else{
            res.render('users/checkout2',{cartItems,userId,grandTotal,addresses,coupon,discount,wallet})
        }
    // } catch (error) {
    //     // res.status(400).send({success:false,message: error.message})
    //     res.render('layouts/somethingWentWrong')
    // }
},
selectAddressCheckOut: async(req,res)=>{
    console.log('booody = ',req.body);
    let address = await AddressModel.findOne({_id: Object(req.body.addressId)})
    console.log(address);
    res.status(200).send({success:true,address})

},
  confirmCheckoutPost: async(req,res)=>{
        
    try {                
        console.log('38333333 = ',req.body);
        const userDetails = await UsersModel.findOne({email: req.session.userEmail});
        let userId = userDetails._id.valueOf()
        // let userId = '6360a2eea72cffca128104bf'
        let objUserId = ObjectId(userId)
        
        console.log('389');
        //setting address
        const address = {
            userId : objUserId,
            name    :   req.body.name,
            phone   :   req.body.phone,
            fullAddress  :   req.body.address,
            country :   req.body.country,
            state   :   req.body.state,
            district: req.body.district,
            landmark: req.body.landmark,
            city: req.body.city,
            pincode :   req.body.pincode,
        }
        let timee = Date.now()
        // let grandTotal = await userHelper.getTotalCartAmount(userId)
        let grandTotal = req.body.grandTotal
        let discount = req.body.discount;
        console.log('406 = ',grandTotal);
        console.log('406 = ',discount);
        let cartItems = await userHelper.getAllCartItem(userId);
        console.log('407 = ',cartItems);

        console.log('hehehe');
        console.log('new obj ',cartItems);

        //To save address only if newly addedd
        if(req.body.addressRadio != 'on'){
            console.log('Hee');
            const addressNew = new AddressModel(address);
            const res = await addressNew.save();
            console.log('address save = ',res);
        }

        //To place order for each cart items


        cartItems.forEach(async element =>{
            const order = new OrdersModel({
                userId: objUserId,
                cartId: element._id,
                address: address,
                amount: grandTotal,
                paymentMode: 'nill',
                paymentStatus : 'not',
                status : 'pending',
                items : element.item,
                product: element.products[0],
                quantity: element.quantity,
                discountPercentage: discount,
                coupon: req.body.coupon,
                date: timee
            })

            console.log('424');
            const result = await order.save();

            //Update Stock
            let currentPrdt = await ProductsModel.findOne({ _id: element.item })
            let stockNew = parseInt(currentPrdt.stock) - parseInt(element.quantity)
            const updateProduct = await ProductsModel.updateOne({ _id: element.item }, { $set: { stock: stockNew } })
            


            console.log('result',result);
        })
    
       

            //Make Cart Inactive
            cartId = cartItems[0]._id;
            console.log('cartItems Id = ',cartId);
            let updateCart = await CartModel.updateOne({_id:cartId},{'active': false} ,{upsert: true})
            console.log('538');
            console.log('updateCart ==== ',updateCart);
            
            if(req.body.paymentMethod == 'cod'){
                let codPlaced = await OrdersModel.updateMany({cartId:cartId},{$set : {'status': 'placed',paymentMode:'cod'}} ,{upsert: true})
                console.log('codPlaced = ',codPlaced);
                res.status(200).send({success:true,codSuccess:true})
            }
            else if(req.body.paymentMethod=='paypal'){
                 userHelper.generatePaypal(grandTotal).then(async (link)=>{
                    let codPlaced = await OrdersModel.updateMany({cartId:cartId},{$set :{'status': 'placed',paymentMode:'paypal',paymentStatus:'payed'}} ,{upsert: true})
                    res.status(200).send({success:true,paypalSuccess:true,link})
                })
            }else if(req.body.paymentMethod=='razorpay'){
                userHelper.generateRazorpay(cartItems[0]._id,parseInt(grandTotal)).then(async (response)=>{
                    
                    // let codPlaced = await OrdersModel.updateMany({cartId:cartId},{$set :{'status': 'placed',paymentMode:'razorpay',paymentStatus:'payed'}} ,{upsert: true})
                    console.log('463 +',response);
                    res.status(200).send(response)
                })
            }else if(req.body.paymentMethod=='wallet'){
                console.log('wallet');
                let walletPlaced = await OrdersModel.updateMany({cartId:cartId},{$set : {'status': 'placed',paymentMode:'wallet'}} ,{upsert: true})
                console.log('570 = ',walletPlaced);
                let walletBalance = await userHelper.getWalletAmount(userId)
                console.log('572 = ',walletBalance);
                let remaining = parseInt(walletBalance) - grandTotal
                console.log('574 = ',remaining);
                let result2 = await UsersModel.updateOne({_id:Object(userId)},{wallet:remaining},{upsert:true})
                console.log('576 = ',result2);

                console.log('wallet = ',walletPlaced);
                res.status(200).send({success:true,codSuccess:true})
            }



       
        // res.redirect('order-success')

    } catch (error) {
        // res.redirect('login')
        res.render('layouts/somethingWentWrong')
    }
},
            //RazorPay
            verifyRazorpayPayment: (req,res)=>{

                userHelper.verifyRazorpay(req.body).then(async ()=>{
                    console.log('738');
                    let status = 'placed'
                    
                    let razorPlaced = await OrdersModel.update({cartId:cartId},{$set: {'status': 'placed',paymentMode:'razorpay',paymentStatus:'payed'}} ,{upsert: true})
                    console.log('738 =',razorPlaced);

                    res.status(200).send({status:true})                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                }).catch((err)=>{
                    console.log('erro = ',err);
                    res.status(400).send({status:false})
                })
            },




myProfileGet : async(req,res)=>{
    try {
        let userDetails = await UsersModel.findOne({email:  req.session.userEmail });
        if(userDetails==null) throw 'user not logined'

        const addresses = await AddressModel.find({userId: userDetails._id}).sort({date:-1})
        res.render('users/my-profile',{userDetails,addresses})
    } catch (error) {
        res.redirect('login')
    }
},
addAddressProfilePost: async(req,res)=>{
    try {
        // const userDetails = await userHelper.getUserDetails(req.session.userEmail)
        let userDetails = await UsersModel.findOne({email:  req.session.userEmail });

        if(userDetails==null) throw 'user not loggined'

        const address = await new AddressModel({
            userId: userDetails._id,
            name : req.body.name,
            phone: req.body.phone ,
            country: req.body.country ,
            fullAddress: req.body.address ,
            pincode: req.body.pincode ,
            city: req.body.city,
            state: req.body.state ,
            district: req.body.district ,
            landmark: req.body.landmark,
            date: Date.now()
        }) 

        const result = await address.save();

        res.status(200).send({success:true,message:  'Edit Success'})
    } catch (error) {
        res.status(400).send({success:false,message:  'Something went wrong'})
    }
},

//orders

orderSuccessView: async(req,res)=>{
    res.render('users/order-success')
},
ordersView : async(req,res)=>{
    try {
        res.locals.moment = moment;
        const userDetails = await Register.findOne({email: req.session.userEmail});
        let userId = userDetails._id.valueOf()
        // let userId = '6360a2eea72cffca128104bf'
        let objUserId = ObjectId(userId)

        let orders = await OrdersModel.find({userId: Object(userId)}).sort({date:1})
        // console.log('osdf  ',orders);


        let cartIds = await OrdersModel.aggregate([{ $match: { userId: ObjectId(userId) } },
            { $group: { _id: null, orderId: { $addToSet: "$cartId" } } },
            { $unwind: "$orderId" }, { $project: { _id: 0 } }, { $sort: { date: 1 } }])
            let carr = [];
            cartIds.forEach(cart => {
                carr.push(cart.orderId.valueOf())
            });



        res.render('users/orders',{orders,cartIds: carr})
    } catch (error) {
        res.redirect('login')
    }
},
cancelOrder : async(req,res)=>{
    try {
        let orderId= req.body.orderId;
        console.log(orderId);
        const result = await OrdersModel.updateOne({_id: Object(orderId)},{$set : {'status':'cancelled'  }})
        console.log('res = ',result);
        res.status(200).send({success:true,message: 'Success'})
    } catch (error) {
        res.status(400).send({success:false,message: error.message})
    }
},
viewOrderedProduct: async(req,res)=>{
    try {
        let orderId = req.query.id
        let orderedItems = await OrdersModel.findOne({_id:Object(orderId)})
        console.log('ord ',orderedItems.items);
        res.render('users/ordered-products', {orderedItems : orderedItems.items})
    } catch (error) {
        res.redirect('/login')
    }
},


//address

editUserPost : async(req,res)=>{
    console.log('661 = ',req.body );
    try {
        let userDetails = await UsersModel.findOne({email: req.session.userEmail})
        if(userDetails==null) throw 'user not loggined'
        

        let emailCount = await UsersModel.find({$and:[{email: req.body.email}, {email: {$ne : req.session.userEmail } }]}).count()
        if(emailCount){
            var emailExist = true;
            throw 'Email already Exists!' 
        }
        
        const result = await UsersModel.updateOne({  _id: userDetails._id },{ 
            $set:{
            name: req.body.name,
            lastname : req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            gender: req.body.gender
            }
        } ,{upsert: true});
        console.log('resss = ',result);

        res.status(200).send({success:true,message:  'Edit Success'})
    } catch (error) {
        console.log('error = ',error);
        res.status(200).send({success:false,message: error,emailExist})
    }
},
editAddressPost: async(req,res)=>{
    console.log('editing');
    try {
        const userDetails = await userHelper.getUserDetails(req.session.userEmail)
        if(userDetails==null) throw 'user not loggined'
        
        const result = await AddressModel.updateOne({  _id: Object(req.body.addressId) },{
            name : req.body.name,
            phone: req.body.phone ,
            country: req.body.country ,
            fullAddress: req.body.address ,
            pincode: req.body.pincode ,
            city: req.body.city,
            state: req.body.state ,
            district: req.body.district ,
            landmark: req.body.landmark
        } ,{upsert: true});

        res.status(200).send({success:true,message:  'Edit Success'})
    } catch (error) {
        res.status(400).send({success:false,message:  'Something went wrong'})
    }

    
},

deleteAddressPost: async(req,res)=>{
    try {
        const address = await AddressModel.deleteOne({_id: Object(req.body.addressId)})
        res.status(200).send({success:true,message:  'Delete Success'})
    } catch (error) {
        res.status(400).send({success:false,message:  'Something went wrong'})
    }
},
changePassword: async (req, res) => {
    console.log('req = ', req.body);
    let userDetails = await UsersModel.findOne({ email: req.session.userEmail })
    console.log(' dd' , userDetails);
    if (await bcrypt.compare(req.body.currentPass, userDetails.password)) 
        {
            console.log('655');
            const passwordHashed = await bcrypt.hash(req.body.newPass, 10)

            await UsersModel.updateOne({ email: req.session.userEmail }, { password: passwordHashed })
            res.status(200).send({ response: true })
        }
        else
        {
            res.status(200).send({ response: false })
        }
},
returnOrder: async (req, res) => {
    try {
        let orderId = req.body.orderId
        console.log("873",orderId);
        let returnPrice = parseInt(req.body.returnPrice)
        console.log("875",returnPrice);
        let result = await OrdersModel.updateOne({ _id: Object(orderId) }, { status: 'returned' })
        console.log("877",result);
        let userDetails = await Register.findOne({ email: req.session.userEmail })
        console.log("879",userDetails);
        if (userDetails.wallet != undefined) {
            let wallet = userDetails.wallet
            console.log("882",wallet);
            wallet = parseInt(wallet) + parseInt(returnPrice)
            let result2 = await Register.updateOne({ email: req.session.userEmail}, { wallet: wallet }, { upsert: true })
        }
        else {
            let result2 = await Register.updateOne({ email: req.session.userEmail }, { wallet: returnPrice }, { upsert: true })
        }
        res.status(200).send({ success: true, msg: 'Success' })
    } catch (error) {
        res.status(400).send({ success: true, msg: 'Something went wrong' })
    }
},




    // Coupons
    applyCoupon: async (req, res) => {
        console.log('90000');
        try {
            let couponDetails = await CouponModel.findOne({ coupon: req.body.coupon })
            let checkAlreadyUsed = await CouponModel.findOne({ coupon: req.body.coupon, usedBy: { $in: [req.session.userEmail] } }).count()

            console.log('905');
            if (checkAlreadyUsed == 0) {
                if (couponDetails != null) {
                    let result = await CouponModel.updateOne({ coupon: req.body.coupon }, { $push: { usedBy: req.session.userEmail } })
                    console.log('908');
                    res.status(200).send({ success: true, discount: couponDetails.percentage })
                } else {
                    console.log('9088');
                    console.log('9088');
                    res.status(200).send({ success: false, msg: 'Invalid coupon.' })
                }
            } else {
                console.log('908999');
                res.status(200).send({ success: false, msg: 'Invalid coupon.' })
            }
            
        } catch (error) {
            console.log('922 = ',error);
            res.status(400).send({ success: false, msg: 'Something went Wrong!' })
        }
    }   



}


module.exports = userController;