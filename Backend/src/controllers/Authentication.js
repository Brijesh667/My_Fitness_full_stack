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

        // CHANGED: Check if user already exists before creating
        const existingUser = await User.findOne({emailId});
        if(existingUser)
            return res.status(400).json({message: 'User already exists'})

        req.body.password = await bcrypt.hash(password,10);
        req.body.role = 'user'
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: "1h"})
        const reply = {
            firstName:user.firstName,
            emailId:user.emailId,
            age:user.age,
            role:user.role,
            _id:user._id
        }

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        // CHANGED: was res.status(200).json({user:reply, message:...}) — same but now consistent
        res.status(200).json({
            user:reply,
            message:"User Register successfully"
        })
    }
    catch(err){
        // CHANGED: was res.status(400).send('Error'+err) — now sends JSON with message key
        res.status(400).json({message: err.message})
    }
}

//User Login
const login = async(req,res)=>{
    try{
        const {emailId,password} = req.body;
        if(!emailId)
            throw new Error('Required field missing')
        if(!password)
            throw new Error('Required field missing')
        if(!validator.isEmail(emailId))
            throw new Error('Invalid email')

        const user = await User.findOne({emailId});
        if(!user)
            throw new Error('Invalid credentials')

        const match_password = await bcrypt.compare(password,user.password)
        if(!match_password)
            throw new Error('Invalid credentials')

        const token = jwt.sign({_id:user._id, emailId:user.emailId, role:user.role},process.env.JWT_KEY,{expiresIn: "1h"})
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });
        const reply = {
            firstName:user.firstName,
            emailId:user.emailId,
            age:user.age,
            role:user.role,
            _id:user._id
        }

        res.status(200).json({
            user:reply,
            message:'Login successfully'
        })
    }
    catch(err){
        // CHANGED: was res.status(401).send('Error: '+err) — now sends JSON with message key
        res.status(401).json({message: err.message})
    }
}

//logout
const logout = async(req,res)=>{
    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`,'Blocked')
        await redisClient.expireAt(`token:${token}`,payload.exp);
        res.clearCookie('token');
        res.status(200).send('Logged out successfully...')
    }
    catch(err){
        // CHANGED: was res.status(401).send('Error'+err) — now sends JSON
        res.status(401).json({message: err.message})
    }
}

//admin Register 
const adminRegister = async(req,res)=>{
    try{
        auth_validate(req.body)
        const {firstName,emailId,password} = req.body;
        req.body.password = await bcrypt.hash(password,10);
        const user = await User.create(req.body)
        const token = jwt.sign({_id:user._id, emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: "1h"})
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });
        const reply = {
            firstName:firstName, 
            emailId:emailId, 
            age:user.age,
            role:user.role, 
            _id:user._id
        }

        res.status(201).json({
            user:reply,
            message:'Admin Register successfully...'
        })
    }
    catch(err){
        // CHANGED: was res.status(404).send('Error: '+err) — now sends JSON
        res.status(400).json({message: err.message})
    }
}

const AuthCheck = async(req,res)=>{
   try{
        const reply = {
            firstName:req.user.firstName,
            emailId:req.user.emailId,
            age:req.user.age,   // CHANGED: was user.age (bug — user not defined), now req.user.age
            role:req.user.role,
            _id:req.user._id
        }

        res.status(200).json({   // CHANGED: was 201, should be 200 for a GET/check
            user:reply,
            message:'valid user'
        })
   }
   catch(err){
        // CHANGED: was res.status(404).send('Error: '+err) — now sends JSON
        res.status(401).json({message: err.message})
   }
}

module.exports = {register,login,logout,adminRegister,AuthCheck}