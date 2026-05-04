const express = require('express');
const { adminmiddleware } = require('../middleware/verifymiddleware');
const {createadminweek, admin_week} = require('../controllers/adminWeekCreater')
const adminWeekSave = express.Router();


adminWeekSave.post('/create',adminmiddleware,createadminweek)
adminWeekSave.get('/find',adminmiddleware,admin_week)
module.exports = adminWeekSave;

