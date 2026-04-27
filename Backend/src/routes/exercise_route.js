const express = require("express");
const { usermiddleware } = require("../middleware/verifymiddleware");
const exerciseRoute = express.Router(); 
const {create_exercise,create_many_exercise,update_exercise,find_exercise,delete_exercise} = require('../controllers/exercise_operation');


//create exercise
exerciseRoute.post('/create',usermiddleware,create_exercise)
//create insert many 
exerciseRoute.post('/create-many',usermiddleware,create_many_exercise)
//update exercise
exerciseRoute.patch('/update/:id',usermiddleware,update_exercise)
//find exerise
exerciseRoute.get('/find/:id',usermiddleware,find_exercise)
//delete exercise
exerciseRoute.delete('/delete/:id',usermiddleware,delete_exercise)

module.exports = exerciseRoute