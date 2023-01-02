const express = require('express')
const adminController = require('../controller/adminController')
const router = express.Router()
const multer        =   require('multer')


const setAdminLayout = (req,res,next)=>{
    res.locals.layout = 'layouts/adminsLayout'
    next()  
}


const adminLoginCheck = ((req,res,next)=>{

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if(!req.session.loggedIn)
        res.redirect('/admin')
    else if(!req.session.admin)
        res.redirect('/')
    else
        next();
})

const forLogin =  ((req,res,next)=>{
    if(req.session.loggedIn&&req.session.admin)
        res.redirect('/admin')
    else if(req.session.loggedIn &&  !req.session.admin)
        res.redirect('/')
    else
        next();
}) 

////////////////////////////////////////////////////////////////////////////////////////////////////////


    // CATEGORIES MULTER START

 //Define Storage for images

const categoryStorage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null,'./public/uploads/categories')
    },

    //extention
    filename: (req,file,callback)=>{
        callback(null,Date.now()+file.originalname)
    }
})

//upload parameters for multer

const upload = multer({
    storage: categoryStorage,
    limits:{
        fieldSize: 1024*1024*5
    }
})
// CATEGORIES MULTER ENDS//



// PRODUCT MULTER START//

 //Define Storage for images
const productStorage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null,'./public/uploads/products')
    },

    //extention
    filename: (req,file,callback)=>{
        callback(null,Date.now()+file.originalname)
    }
})

//upload parameters for multer
const uploadPrdt = multer({
    storage: productStorage,
    limits:{
        fieldSize: 1024*1024*5
    }
})

// CATEGORIES MULTER ENDS //




// EDIT CATEGORY

const storageEngine = multer.diskStorage({
destination: (req, file, cb) => { cb(null, "./public/uploads/categories") },
filename: (req, file, cb) => { cb(null, file.originalname) }, 
})

const imageFilter = (req, file, cb) => {
if ( file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "image/jpg") {
    cb(null, true) } else { cb(null, false)}
}

uploadHandler = multer({ storage: storageEngine, fileFilter: imageFilter })

// EDIT CATEGORY END//



//Edit Product //

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/products')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})
const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const uploadImage = multer({ storage: storage, fileFilter: filefilter })
const uploadMultipleFiled = uploadImage.fields([{name:'image1', maxCount:1}, {name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}])

router.post('/edit-product',uploadMultipleFiled, adminController.editProductPost)

//banner
  // Banner
  const bannerStorage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null,'./public/uploads/banner')
    },

    //extention
    filename: (req,file,callback)=>{
        callback(null,Date.now()+file.originalname)
    }
})


   //upload parameters for multer
   const upload2 = multer({
    storage: bannerStorage,
    limits:{
        fieldSize: 1024*1024*5
    }
})
// BANNER END



/////////////////////////////////////////////////////////////////////////////////////////////////////////



router.use(setAdminLayout)


//login


router.get('/index',adminLoginCheck,adminController.dashboard)
router.get('/',forLogin,adminController.loginGet)
router.post('/admin-login',forLogin,adminController.loginPost)

//logout
router.get('/admin-logout',adminLoginCheck,adminController.adminLogout)
//block and unblock and view user
router.get('/block-user',adminController.blockUser)
router.get('/unblock-user',adminController.unBlockUser)
router.get('/view-user',adminLoginCheck,adminController.viewuserGet)
//category
router.get('/add-category',adminController.addCategoryGet)
router.post('/add-category',upload.single('image'),adminController.addCategoryPost)
router.get('/view-category',adminController.viewcategoryGet)
router.get('/edit-category',adminController.editCategoryGet)
router.post('/edit-category',upload.single('image'),adminController.editCategoryPost)
router.delete('/delete-category',adminController.deleteCategory)
//product
router.get('/add-product',adminLoginCheck,adminController.addProductGet)
router.post('/add-product',uploadPrdt.array('image1',4),adminController.addProductPost)
router.get('/view-product',adminLoginCheck,adminController.viewProductsGet)
router.delete('/delete-product',adminController.deleteProduct)
router.get('/edit-product',adminLoginCheck,adminController.editProductGet)
router.patch('/stock-update',adminController.stockUpdate)



//orders

router.get('/orders',adminController.ordersViewAdmin)
router.post('/change-order-status',adminController.changeOrderStatus)
router.get('',adminLoginCheck,adminController.viewOrderedProduct)

//Banner
router.get('/banners',adminController.bannersView)
router.get('/add-banners',adminController.addBannerView)
router.post('/add-banner',upload2.single('image'),adminController.addBannerPost)
router.get('/edit-banner',adminController.editBannerView)
router.post('/edit-banner',upload2.single('image'),adminController.editBannerPost)
router.delete('/delete-banner',adminController.deleteBanner)

//Coupons
router.get('/coupons',adminLoginCheck,adminController.couponsGet)
router.get('/add-coupons',adminLoginCheck,adminController.addCouponsGet)
router.post('/add-coupon',adminLoginCheck,adminController.addCouponsPost)
router.get('/edit-coupon',adminLoginCheck,adminController.editCouponGet)
router.post('/edit-coupon',adminLoginCheck,adminController.editCouponPost)
router.delete('/delete-coupon',adminLoginCheck,adminController.deleteCoupon)

//offer
router.get('/offer-products',adminController.offerProductsGet)
router.get('/add-product-offer',adminController.addProductOfferGet)
router.post('/add-product-offer',adminController.addProductOfferPost)
router.get('/edit-offer-product',adminController.editOfferProductsGet)
router.patch('/edit-product-offer',adminController.editOfferProductsPatch)
router.delete('/delete-product-offer',adminController.deleteOfferProduct)


// Sales Report

router.get('/sale-report',adminLoginCheck,adminController.viewSalesManagement)
router.get('/sales-report',adminLoginCheck,adminController.viewSalesManagements)


module.exports = {
    routes: router
}