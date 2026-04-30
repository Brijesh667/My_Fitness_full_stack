const express = require('express')
require('dotenv').config()
const main = require('./config/database')
const redisClient = require('./config/redis')
const authRoute = require('./routes/userAuth_route')
const exerciseRoute = require('./routes/exercise_route')
const cookieParser = require('cookie-parser')
const dayRoute = require('./routes/day_route')
const weekRoute = require('./routes/week_route')
const daysave = require('./routes/create_full_day_controller')
const cors = require('cors')

const app = express();
app.use(express.json())
app.use(cookieParser());
app.use(cors({
    origin:'http://localhost:5174',
    credentials:true
}))
app.use('/user',authRoute);
app.use('/exercise',exerciseRoute);
app.use('/day',dayRoute)
app.use('/week',weekRoute)
app.use('/save',daysave)
const InitalizeConnection = async function(){
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log('Data base-connected successfully...')
        app.listen(process.env.PORT,()=>{
            console.log("Server is listing on port "+process.env.PORT+'...')
        })

    }
    catch(err)
    {
        console.log('Error:'+err)
    }
}

InitalizeConnection();