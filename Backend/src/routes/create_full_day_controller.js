const express = require('express');
const { usermiddleware } = require('../middleware/verifymiddleware');
const {createDayWorkoutController} = require('../controllers/create_full_day_workout')
const daysave = express.Router();


daysave.post('/create',usermiddleware,createDayWorkoutController)
module.exports = daysave;

