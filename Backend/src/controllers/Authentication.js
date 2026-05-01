const auth_validate = require('../utils/auth_validation')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const redisClient = require('../config/redis')

//User Register
const register = async(req,res)=>{
    try{
        const {emailId, password} = req.body;
        auth_validate(req.body);

        req.body.password = await bcrypt.hash(password,10);
        req.body.role = 'user'
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn:60*60*1000})
        const reply = {
            firstName:user.firstName,
            emailId:user.emailId,
            age:user.age,
            role:user.role,
            _id:user._id
        }

        res.cookie('token',token,{maxAge:60*60*1000});
        res.status(200).json({
            user:reply,
            message:"User Register successfully"
        })
    }
    catch(err){
        res.status(400).send('Error'+err)
    }
}

//User Login
const login = async(req,res)=>{
    try{
        const {emailId,password} = req.body;
        if(!emailId)
            throw new Error('required field missing')
        if(!password)
            throw new Error('required field missing')
        if(!validator.isEmail(emailId))
            throw new Error('Invalid email')

        const user = await User.findOne({emailId});
        if(!user)
            throw new Error('Invalid credential')

        const match_password = await bcrypt.compare(password,user.password)
        if(!match_password)
            throw new Error('Invalid credential')

        const token = jwt.sign({_id:user._id, emailId:user.emailId, role:user.role},process.env.JWT_KEY,{expiresIn:1000*60*60})
        res.cookie('token',token,{maxAge:60*60*1000})
        const reply = {
            firstName:user.firstName,
            emailId:user.emailId,
            age:user.age,
            role:user.role,
            _id:user._id
        }

        res.status(200).json({
            user:reply,
            message:'login successfully'
        })
    }
    catch(err){
        res.status(401).send('Error: '+err)
    }

}

//logout
const logout = async(req,res)=>{
    try{

        const {token} = req.cookies;
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`,'Blocked')
        await redisClient.expireAt(`token:${token}`,payload.exp);
        res.cookie('token',null,{expiresIn:new Date(Date.now())});
        res.status(200).send('Logged out successfully...')
    }
    catch(err)
    {
        res.status(401).send('Error'+err)
    }
}

//admin Register 
const adminRegister = async(req,res)=>{
    try{
        auth_validate(req.body)
        const {firstName,emailId,password} = req.body;
        req.body.password = await bcrypt.hash(password,10);
        const user = await User.create(req.body)
        const token = jwt.sign({_id:user._id, emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn:100*60*60})
        res.cookie('token',token,{maxAge:100*60*60});
        const reply = {
            firstName:firstName, 
            emailId:emailId, 
            age:user.age,
            role:user.role, 
            _id:user._id
        }

        res.status(201).json({
            user:reply,
            message:'Admin Regsiter successfully...'
        })
    }
    catch(err)
    {
        res.status(404).send('Error: '+err)
    }

}

const AuthCheck = async(req,res)=>{
   try
   {
        const reply = {
            firstName:req.user.firstName,
            emailId:req.user.emailId,
            age:user.age,
            role:req.user.role,
            _id:req.user._id
        }

        res.status(201).json({
            user:reply,
            message:'valid user'
        })
   }
   catch(err)
   {
    res.status(404).send('Error: '+err)
   }
}
module.exports = {register,login,logout,adminRegister,AuthCheck}


