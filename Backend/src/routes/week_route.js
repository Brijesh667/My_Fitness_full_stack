const express = require('express')
const weekRoute = express.Router();
const {usermiddleware} = require('../middleware/verifymiddleware')
const {create_week,week_update,find_week} = require('../controllers/week_operation')


weekRoute.post('/create',usermiddleware,create_week)
weekRoute.patch('/update/:id',usermiddleware,week_update)
weekRoute.get('/find/:id',usermiddleware,find_week)
module.exports = weekRoute
    