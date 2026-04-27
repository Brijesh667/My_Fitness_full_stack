const express = require('express')
const authRoute = express.Router();
const {usermiddleware,adminmiddleware} = require('../middleware/verifymiddleware')
const {register,login,logout,adminRegister, AuthCheck} = require('../controllers/Authentication')

//Register
authRoute.post('/register',register)
//login
authRoute.post('/login',login)
//logout
authRoute.post('/logout',usermiddleware,logout)
//admin register
authRoute.post('/admin/register',adminmiddleware,adminRegister)
//AuthCheck
authRoute.get('/authcheck',usermiddleware,AuthCheck)

module.exports = authRoute;