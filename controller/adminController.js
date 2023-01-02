const ObjectId = require('mongoose').Types.ObjectId
const express = require('express')
const adminModel = require('../models/admin')
const UsersModel = require('../models/user')
const CategoryModel = require('../models/category')
const ProductsModel = require('../models/product')
const OrdersModel    =   require('../models/orders')
const BannersModel    =   require('../models/banner')
const CouponsModel   =   require('../models/couponModel')
const OfferProductsModel = require('../models/offerProduct')
const adminHelper = require('../helpers/adminHelper')

const bcrypt = require('bcrypt')
const session = require('express-session')
const AdminModel = require('../models/admin')
const moment = require ("moment");
const salesHelpers = require('../helpers/salesManagingHelper')
const { Console } = require('console')

fs = require('fs');
const app = express()
const router = express.Router()

const adminController = {
    loginGet: (req, res) => {
        res.render('admin/login', { layout: 'admin/login' })
    },
    loginPost: async (req, res, next) => {
      
        const email = req.body.email;
        const password = req.body.password;
        const adminDetails = await AdminModel.findOne({ email: email });
        if (adminDetails == null) {
            res.render('admin/login', { error: true, msg: 'Invalid Username or Password', layout: 'admin/login' });
        } else {
            try {
                if (password == adminDetails.password) {
                    req.session.userEmail = req.body.email;
                    req.session.loggedIn = true;
                    req.session.admin = true;
                    res.redirect('index')
                } else {
                    res.render('admin/login', { error: true, msg: 'Invalid Username or Password', layout: 'admin/login' });
                }
            } catch (error) {
                res.status(400).send(error)
            }
        }
    },
   
    adminLogout: (req, res) => {

        req.session.destroy((err) => {
            if (err) console.log("Error loging out : ", err)
            else res.redirect('/admin')
        })
    },
   
    dashboard: async(req, res) => {
        // try {
            let revenueDaily =  await   adminHelper.dailyRevenue()
            console.log('39');
            let revenueWeekly =  await   adminHelper.weeklyRevenue()
            let revenueYearly =  await   adminHelper.yearlyRevenue()
            let revenueTotal =  await   adminHelper.totalRevenue()
            console.log('revenueDaily', revenueDaily)
            console.log('revenueWeekly', revenueWeekly)
            console.log('revenueYearly', revenueYearly)
            console.log('revenueTotal', revenueTotal)

            let totalUsers = await adminHelper.getUsersCount();
            let ordersCount = await adminHelper.getOrdersCount();
            let deliveredCount = await adminHelper.getDeliveredOrderCount();
            let productsCount = await adminHelper.getProductsCount();
        res.render('admin/index',{revenueDaily,revenueWeekly,revenueYearly,revenueTotal,totalUsers,ordersCount,productsCount,deliveredCount})
    // } catch (error) {
    //     res.redirect('view-products')
    // }

    },
    viewuserGet: async (req, res) => {
        const users = await UsersModel.find({}).sort({ _id: -1 });
        res.render('admin/view-user', { users })

    },
    blockUser: async (req, res, next) => {
        let userId = req.query.id;
        const result = await UsersModel.updateOne({ _id: Object(userId) }, { 'active': false }, { upsert: true });
        console.log(result);
        res.redirect('view-user')
    },
    unBlockUser: async (req, res, next) => {
        let userId = req.query.id;
        const result = await UsersModel.updateOne({ _id: Object(userId) }, { 'active': true }, { upsert: true });
        console.log(result);
        res.redirect('view-user')
    },


    addCategoryGet: (req, res, next) => {
        res.render('admin/add-category')
    },

    addCategoryPost :   async(req,res,next)=>{
        try{
        let img1
        let count = await CategoryModel.find({categoryTitle:req.body.title}).count();
        console.log(count);
        if(count==0){
            if (req.file!=undefined)    img1 = req.file.filename
            let category;
            // const category = new CategoryModel({
            //     categoryTitle: req.body.title,
            //     offerStart: req.body.startDate,
            //         offerEnd: req.body.endDate,
            //         discount: parseInt(req.body.percentage),
            //         offerActive: true,
            //         categoryActive: true,
            //     image: img1
            // }) 
            if(req.body.offerToggler){
                category = new CategoryModel({
                    categoryTitle: req.body.title,
                    offerStart: req.body.startDate,
                    offerEnd: req.body.endDate,
                    discount: parseInt(req.body.percentage),
                    offerActive: true,
                    categoryActive: true,
                    image: img1
                }) 

            }else{
                category = new CategoryModel({
                    categoryTitle: req.body.title,
                    offerActive: false,
                    categoryActive: true,
                    image: img1
                }) 
            }
          console.log("error",count);
            const result = await category.save();
           
    
            res.redirect('view-category')
        }else{
            res.render('admin/add-category',{error:true,msg:'Category already exists!'})
        }
    }catch(error){
        res.status(400).send(error)
    }
    },
    viewcategoryGet: async (req, res, next) => {
        const category = await CategoryModel.find({}).sort({ _id: -1 })
        res.locals.moment = moment;
        res.render('admin/view-category', { category })
    },
    editCategoryGet: async (req, res, next) => {
        let catId = req.query.id;
        const category = await CategoryModel.findOne({ _id: Object(catId) })
        res.render('admin/edit-category', { category })
    },
    editCategoryPost: async (req, res, next) => {
        const catid = req.body.catid;
        // const result = await CategoryModel.updateOne({ _id: Object(catid) }, { 'categoryTitle': req.body.title }, { upsert: true });

        let currentCategory =  await CategoryModel.findOne({_id: catid})

        if(req.body.offerToggler){
            var result = await CategoryModel.updateOne({  _id: Object(catid) },
                            {'categoryTitle': req.body.title,
                            categoryTitle: req.body.title,
                            offerStart: req.body.startDate,
                            offerEnd: req.body.endDate,
                            discount: parseInt(req.body.percentage),
                            offerActive: true,
                            categoryActive: true
                        } ,
                            {upsert: true});

                        console.log('dddd');
            let productUpdate= await ProductsModel.updateMany({'category': currentCategory.categoryTitle},
                        {category:req.body.title , categoryOfferActive : true,categoryOffer : 
                            {
                                offerStart: req.body.startDate,
                                offerEnd: req.body.endDate,
                                discount: parseInt(req.body.percentage),
                                offerActive: true,
                            }
                        })
            console.log('prrrr = ',productUpdate);

        }else{
            let productUpdate= await ProductsModel.updateMany({'category': currentCategory.categoryTitle},
                        {category:req.body.title , categoryOfferActive : false ,$unset:{categoryOffer:''} })
            var result = await CategoryModel.updateOne({  _id: Object(catid) },
            {'categoryTitle': req.body.title,offerActive: false,categoryActive: true ,
            $unset:{ 'discount':'','offerStart':'','offerEnd':'' } } ,{upsert: true});
        }



        const getOldImg = await CategoryModel.findOne({ _id: Object(catid) });
        if (req.file) {
            if (fs.existsSync('./public/uploads/categories/' + getOldImg.image)) {
                fs.unlinkSync('./public/uploads/categories/' + getOldImg.image)
            }
            const result = await CategoryModel.updateOne({ _id: Object(catid) }, { 'image': req.file.filename }, { upsert: true });
        }
        res.redirect('view-category')
    },
    deleteCategory : async(req,res,next)=>{
        try {
            const categoryId = req.body.categoryId;
            let categoryTemp = await CategoryModel.findOne({_id: Object(categoryId) })
            
            const category = await CategoryModel.deleteOne({_id: Object(categoryId)})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },

    addProductGet: async (req, res) => {
        const category = await CategoryModel.find({})
        res.render('admin/add-product', { category })
    },
    addProductPost : async(req,res)=>{
        const category= await CategoryModel.find({})

        if (req.files[0]!=undefined) 
        {  img1 = req.files[0].filename}
        if (req.files[1]!=undefined)
          { img2 = req.files[1].filename}
        if (req.files[2]!=undefined)  
         { img3 = req.files[2].filename}
        if (req.files[3]!=undefined)  
         { img4 = req.files[3].filename}

        var product = new ProductsModel({
      
            title: req.body.title,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            img1: img1,
            img2: img2,
            img3: img3,
            img4: img4,
            stock: req.body.stock
           
        }) 
        const result = await product.save();
        res.redirect('view-product')
    },
    viewProductsGet :    async(req,res)=>{
        const products = await ProductsModel.find({}).sort({_id:-1})
        res.render('admin/view-product',{products})
    },
    deleteProduct : async(req,res)=>{
        try {
            const productId = req.body.productId;
            const product = await ProductsModel.deleteOne({_id: Object(productId)})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },
    editProductGet : async(req,res) =>{
        let catId = req.query.id;
        const product = await ProductsModel.findOne({_id: Object(catId)})
        const categories = await CategoryModel.find({})
        res.render('admin/edit-product',{product,categories})
    },
  
    editProductPost : async(req,res) =>{
        try {
            let proData = req.body
            let images = req.files
            let id = proData.id
            
            let oldProduct = await ProductsModel.findOne({_id:Object(proData.prdId)})
            console.log(oldProduct);

            var img1, img2, img3, img4;
            if (images.image1!=undefined){
                
                if (fs.existsSync('./public/uploads/products/'+oldProduct.img1)) {  //Check if file exists
                    console.log('ting');
                    fs.unlinkSync('./public/uploads/products/'+oldProduct.img1)
                }
                img1 = images.image1[0].filename
            }   
            if (images.image2!=undefined){
                if (fs.existsSync('./public/uploads/products/'+oldProduct.img2)) {  //Check if file exists
                    fs.unlinkSync('./public/uploads/products/'+oldProduct.img2)
                }
                img2 = images.image2[0].filename  
            }   
            if (images.image3!=undefined){
                if (fs.existsSync('./public/uploads/products/'+oldProduct.img3)) {  //Check if file exists
                    fs.unlinkSync('./public/uploads/products/'+oldProduct.img3)
                }
                img3 = images.image3[0].filename
            }   
            if (images.image4!=undefined){
                if (fs.existsSync('./public/uploads/products/'+oldProduct.img4)) {  //Check if file exists
                    fs.unlinkSync('./public/uploads/products/'+oldProduct.img4)
                }
                img4 = images.image4[0].filename
            }
                    
            let result = await ProductsModel.findByIdAndUpdate({_id:Object(proData.prdId)}, {
                title: proData.title,
                category: proData.category,
                gender: proData.gender,
                brand: proData.brand,
                price: proData.price,
                description: proData.description,
                img1: img1,
                img2: img2,
                img3: img3,
                img4: img4,
                stock: proData.stock
            })
            console.log('result = ',result);
            res.redirect('view-product');
        } catch (error) {
                res.send('Error Occured')
        }
    },  stockUpdate: async(req,res)=>{
        try {
            let result = await ProductsModel.updateOne({_id:Object(req.body.productId)},{stock:req.body.stock})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            
        }
    },

//orders
ordersViewAdmin : async(req,res)=>{
    res.locals.moment = moment;
    let orders = await OrdersModel.find({}).sort({date:-1})

    let cartIds = await OrdersModel.distinct('cartId')
    cartIds.reverse()
  
    console.log('ordd = ',orders);

    res.render('admin/orders-admin',{orders,cartIds})
},
changeOrderStatus: async(req,res)=>{
    console.log('hsdfdffffff');
    try {
        console.log('body = ',req.body);
        const orderId = req.body.order;
        const status = req.body.status;
        let result = await OrdersModel.updateOne({  _id: Object(orderId)  },{'status': status}); 
        
        console.log('result = ',result);
        res.status(200).send({success:true,message:  'Edit Success'})
    } catch (error) {
        res.status(400).send({success:false,message:  'Error updating status'})
    }
},
viewOrderedProduct: async(req,res)=>{
    const orderId = req.query.id;
    const result = await OrdersModel.findOne({_id:Object(orderId)})
    console.log('resss = ',result.items);
    res.render('admin/ordered-products-admin',{orederdItems: result.items})        
},


   
    viewSalesManagement : async (req, res) => {
     
        const data = await salesHelpers.monthlyReport()
        const daily = await salesHelpers.dailyReport()
        const weekly = await salesHelpers.weeklyReport()
        const yearly = await salesHelpers.yearlyReport()
       
        res.render('admin/salesReport', {data, daily, weekly, yearly})
        
    },
    viewSalesManagements : async (req, res) => {
     
        const data = await salesHelpers.monthlyReport()
        const daily = await salesHelpers.dailyReport()
        const weekly = await salesHelpers.weeklyReport()
        const yearly = await salesHelpers.yearlyReport()
       
        res.render('admin/sale', {moment,data, daily, weekly, yearly})
        
    },

       // Banners

       bannersView : async( req,res)=>{
        try {
            let banners = await BannersModel.find({}).sort({_id:-1})
            res.render('admin/banner/view_banner',{banners})
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    addBannerView : async( req,res)=>{
        try {
            console.log('643');
            res.render('admin/banner/add-banner')
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    addBannerPost : async(req,res)=>{
        let img1
       
            if (req.file!=undefined)    img1 = req.file.filename

            console.log('body - ',req.body);
            let banner = new BannersModel({
                    title1: req.body.title1,
                    title2: req.body.title2,
                    url: req.body.url,
                    image: img1
                }) 

    console.log(banner);
            const result = await banner.save();
            console.log('result = ',result);
    
            res.redirect('banners')
      
    },
    editBannerView : async( req,res)=>{
        try {
            let banner = await BannersModel.findOne({_id: Object(req.query.id)})
            console.log('banner = ',banner);
            res.render('admin/banner/edit-banner',{banner})
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    editBannerPost : async(req,res)=>{
        try {

        let img1
        let currentBanner = await BannersModel.findOne({_id: Object(req.body.bannerId)})
        if (req.file!=undefined)    img1 = req.file.filename

            console.log('body - ',req.body);

            const result = await BannersModel.updateOne({  
                _id: Object(req.body.bannerId) },{
                    'title1': req.body.title1,
                    title2: req.body.title2,
                    url: req.body.url,
            } ,{upsert: true})

            if(req.file){
                if (fs.existsSync('./public/uploads/banner/'+currentBanner.image)) {  //Check if file exists
                    fs.unlinkSync('./public/uploads/banner/'+currentBanner.image)
                  }
                const result = await BannersModel.updateOne({  _id: Object(req.body.bannerId) },{'image': req.file.filename} ,{upsert: true});
            }
            res.redirect('banners')
                        
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    deleteBanner : async(req,res)=>{
        console.log('d');
        try {
            const bannerId = req.body.bannerId;

            console.log('535 ',Object(bannerId));
            const result = await BannersModel.deleteOne({_id: Object(bannerId)})

            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },

      // Coupons

      couponsGet : async(req,res,next)=>{
        let coupons = await CouponsModel.find({}).sort({_id:-1})
        res.render('admin/coupons',{coupons})
    },
    addCouponsGet : (req,res,next)=>{
        res.render('admin/add-coupon')
    },
    addCouponsPost :   async(req,res,next)=>{
        
        console.log('344');
        console.log(req.body);

        // let img1
        let count = await CouponsModel.find({coupon:req.body.coupon}).count();

        if(count==0){

            const couponT = new CouponsModel({
                coupon: req.body.coupon,
                start: req.body.startDate,
                end: req.body.endDate,
                percentage: req.body.percentage
            }) 
    
            const result = await couponT.save();
            console.log('result = ',result);
    
            res.redirect('coupons')
        }else{
            res.render('admin/add-coupons',{error:true,msg:'Coupon already exists!'})
        }


    },
    editCouponGet : async(req,res)=>{
        let couponId = req.query.id;
        let coupon = await CouponsModel.findOne({_id: Object(couponId)})
        console.log('cou ',coupon);
        res.render('admin/edit-coupon',{coupon})
    },
    editCouponPost: async(req,res)=>{
        console.log(req.body);

        const result = await CouponsModel.updateOne({  
            _id: Object(req.body.couponId) },{'coupon': req.body.coupon,
            'start':req.body.startDate,
            'end': req.body.endDate,
            'percentage': req.body.percentage
        } ,{upsert: true});

        res.redirect('coupons')

    },
    deleteCoupon: async(req,res,next)=>{
        try {
            const couponId = req.body.couponId;
            const coupon = await CouponsModel.deleteOne({_id: Object(couponId)})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },
    
    //product offer
    offerProductsGet : async(req,res,next)=>{
        let productsOffer = await OfferProductsModel.find({}).sort({_id:-1})
        
        let products = await OfferProductsModel.aggregate([ 
            {$project: { product:'$product',start : '$start',end:'$end',offerPercentage:'$offerPercentage' } } ,  
            { $lookup: 
                {from:"products", localField: "product", foreignField:"_id", as: "productss", } 
            } ])  




        res.render('admin/offers/products-offer',{productsOffer,products})
    },
    addProductOfferGet : async(req,res)=>{
        try {
            let products = await ProductsModel.find({productOfferActive: {$ne: true}})
            res.render('admin/offers/add-product-offer',{products})
        } catch (error) {
            res.send('Something Went wrong!!'+error)
        }
    },
    addProductOfferPost :async(req,res)=>{
        try {
            let percentage = parseInt(req.body.percentage)
            // let result = await ProductsModel.updateOne({_id: Object(req.body.product)},{productOffer:req.body,productOfferActive: true},{upsert: true})
            let productId = ObjectId(req.body.porduct);
            console.log('486 ',productId);

            let productDetails = await ProductsModel.findOne({_id: Object(req.body.product)})
            console.log('481',productDetails);
            const productOffer = new OfferProductsModel({
                product: Object(req.body.product),
                productTitle: productDetails.title,
                start: req.body.startDate,
                end: req.body.endDate,
                offerPercentage: percentage,
                active: true
            }) 
            console.log('493');
            
            const result2 = await productOffer.save();
            let result = await ProductsModel.updateOne({_id: Object(req.body.product)},{productOffer:productOffer,productOfferActive: true},{upsert: true})
            console.log('resss = ',result);
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(200).send({success:false,message: 'Something went wrong'})
        }
    },
    editOfferProductsGet: async(req,res)=>{
        let products = await ProductsModel.find({productOfferActive: {$ne: true}})
        let offerId = req.query.id;
        let productOffer = await OfferProductsModel.findOne({_id: Object(offerId)})
        res.render('admin/offers/edit-product-offer',{products,productOffer})
    },
    editOfferProductsPatch: async(req,res)=>{
        try {
            // let result = await ProductsModel.updateOne({_id: Object(req.body.product)},{productOffer:req.body,productOfferActive: true},{upsert: true})
            let productId = ObjectId(req.body.porduct);

            let productDetails = await ProductsModel.findOne({_id: Object(req.body.product)})
            let percentage = parseInt(req.body.percentage)
            console.log('481',productDetails);

            const offer= await OfferProductsModel.updateOne({_id: Object(req.body.offerId)},
                {   
                    product: Object(req.body.product),
                    productTitle: productDetails.title,
                    start: req.body.startDate,
                    end: req.body.endDate,
                    offerPercentage: percentage,
                    active: true
                }
            )
            let updateProduct = await ProductsModel.updateMany({_id: Object(req.body.product)},{
                productOffer:{
                    product: Object(req.body.product),
                    productTitle: productDetails.title,
                    start: req.body.startDate,
                    end: req.body.endDate,
                    offerPercentage: percentage,
                    active: true
                }
            },{$upsert: true})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(200).send({success:false,message: 'Something went wrong'})
        }
    },
    deleteOfferProduct: async(req,res)=>{
        console.log('531');
        try {
            const offerId = req.body.offerId;

            console.log('535',offerId);
            console.log('535',Object(offerId));
            const result = await OfferProductsModel.deleteOne({_id: Object(offerId)})

            const result2 = await ProductsModel.updateOne({_id: Object(req.body.productId)},{$unset:{productOffer:''},productOfferActive:false})
            console.log('536');
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            console.log('540 '+error);
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },


}




module.exports = adminController;