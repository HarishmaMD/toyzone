const express = require('express')
const userController = require('../controller/userController')
const user = require('../models/user')
const ProductsModel = require('../models/product')

const router = express.Router()

const loginCheck = ((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (req.session.admin)
        res.redirect('/admin/index')
    else
        next();
})

const forLogin = ((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (req.session.loggedIn)
        res.redirect('/')
    else
        next();
})
const reEstablish = ((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    next();
})
const restrict = ((req, res, next) => {
    // req.session.previousUrl = '/'
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (req.session.loggedIn)
        next();
    else
        res.redirect('/login')
})

router.get('/', loginCheck, userController.homeView)
router.get('/signup', loginCheck, userController.signupGet)
router.post('/signup', loginCheck, userController.signupPost)
router.get('/login', forLogin, userController.loginGet)
router.post('/login', forLogin, userController.loginPost)

//otp login

router.get('/otp-login', forLogin, userController.otpLoginGet)
router.post('/otp-login', forLogin, userController.otpLoginPost)
router.post('/otp-verify', forLogin, userController.otpVerifyPost)

//logout

router.get('/logout', userController.logout)

//error view

router.get('/404', userController.errorview)

// products

router.get('/view-products', userController.viewProductsGet)
router.get('/single-product', userController.singleProGet)

//category view

router.get('/musical', reEstablish, userController.musicalView)
router.get('/soft', reEstablish, userController.softView)
router.get('/educational', reEstablish, userController.educationalView)




//cart



router.post('/addToCart', userController.addToCartPost)
router.get('/cart', restrict, reEstablish, userController.viewCart)
router.patch('/change-product-quantity', userController.changePrdtQty)
router.delete('/remove-from-cart', userController.removeFromCart)

//checkout

// router.get('/checkout', restrict, reEstablish, userController.checkoutGet)
 router.get('/checkout2', restrict, reEstablish, userController.checkoutGet2)
router.post('/checkout', userController.checkoutPost)
router.post('/confirm-checkout', restrict, userController.confirmCheckoutPost)
router.post('/select-address', userController.selectAddressCheckOut)

// payment
router.post('/verify-payment', restrict, userController.verifyRazorpayPayment)



//oders view

router.get('/order-success', restrict, reEstablish, userController.orderSuccessView)
router.get('/orders', restrict, reEstablish, userController.ordersView)
router.post('/cancel-order', userController.cancelOrder)
router.get('/view-order-products', restrict, reEstablish, userController.viewOrderedProduct)


//Profile
router.use(restrict)
router.get('/my-profile', restrict, userController.myProfileGet)
router.patch('/edit-user-details', restrict, userController.editUserPost)
router.post('/add-address-profile', userController.addAddressProfilePost)
router.post('/edit-address', userController.editAddressPost)
router.post('/delete-address', userController.deleteAddressPost)
router.patch('/change-password', userController.changePassword)


//Coupons
router.post('/apply-coupon',restrict,userController.applyCoupon)



//return

router.patch('/return-order',restrict,userController.returnOrder)

module.exports = {
    routes: router
}