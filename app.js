if(process.env.MODE_ENV !== 'production'){
    require('dotenv').config()

}
const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const path = require('path');
const bodyParser = require('body-parser')

const session = require('express-session')
const adminRouter = require('./routes/adminRouter');
const userRouter = require('./routes/userRouter')



app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}))

app.use((req,res,next)=>{
    res.locals.loggedIn = req.session.loggedIn
    next()
})

app.set('view engine','ejs')
app.set('views',__dirname+'/views')
app.set('layout','layouts/layout')

app.use(expressLayouts)
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false}))


const mongoose = require('mongoose');
const { nextTick } = require('process');
// mongoose.connect(process.env.DATABASE_URL,{
mongoose.connect('mongodb+srv://harishma:harishma123@cluster0.nxask00.mongodb.net/toys',{
    useNewUrlParser:true
})



const db = mongoose.connection
db.on('error',error => console.error(error))
db.once('open',() => console.log("connected to mongoose"))

app.use('/admin',adminRouter.routes)
app.use('/',userRouter.routes)



app.listen(process.env.PORT || 3000)