const redisClient = require('../config/redis');
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const usermiddleware = async(req,res,next)=>
{
    try{

        const {token} = req.cookies;
      
        if(!token)
                throw new Error('Token is not presnet')
       
        const payload = jwt.verify(token,process.env.JWT_KEY)
      

        const _id = payload._id
        if(!_id)
            throw new Error("id not found")

        const user = await User.findById(_id)

        if(!user)
            throw new Error('User doest exist')

        //check in redis, is this token is block
        const isBlock = await redisClient.exists(`token:${token}`);
        if(isBlock)
            throw new Error('token is present in redis...')

        req.user = user;
        next();

    }   

    catch(err)
    {
        res.status(503).send('Error: '+err)
    }



}
const adminmiddleware = async(req,res,next)=>
{
    try{

        const {token} = req.cookies;
        if(!token)
                throw new Error('Token is not presnet')

        const payload = jwt.verify(token,process.env.JWT_KEY)

        const _id = payload._id
        if(!_id)
            throw new Error("Invalid token")

        if(payload.role != 'admin')
            throw new Error('you are not admin')

        const user = await User.findById(_id)

        if(!user)
            throw new Error('User doest exist')

        //check in redis, is this token is block
        const isBlock = await redisClient.exists(`token:${token}`)
        if(isBlock)
            throw new Error('Invalid credential...')

        req.user = user;
        next();

    }   

    catch(err)
    {
        res.status(503).send('Error: '+err)
    }
}

module.exports = {usermiddleware,adminmiddleware}