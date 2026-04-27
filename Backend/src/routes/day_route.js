const express = require('express');
const { usermiddleware } = require('../middleware/verifymiddleware');
const {create_day,get_day,update_day} = require('../controllers/day_operation')
const dayRoute = express.Router();


//day create
dayRoute.post('/create',usermiddleware,create_day)
dayRoute.get('/getDay/:id',usermiddleware,get_day)
dayRoute.patch('/update/:id',usermiddleware,update_day)
module.exports = dayRoute;