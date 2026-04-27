// models/user.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const user_schema = new Schema({
   
    firstName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 20
    },
    lastName: {
        type: String,
        trim: true,
        maxLength: 20
    },
    age: {
        type: Number,
        required: true,
        min: 8,
        max: 100
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        immutable: true,        
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },                                      
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    fitness_goal: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'],
        default:null
    },
    fitness_level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    weight_kg: {
        type: Number,
        min: 20,
        max: 300,
        default:null
    },
    height_cm: {
        type: Number,
        min: 50,
        max: 250,
        default:null
    },

  

   
    profile_pic: {
        type: String,                   
        default: null
    }

}, { timestamps: true });

const User = mongoose.model('User', user_schema);
module.exports = User;
