// models/day.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const day_schema = new Schema({
    day_name: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    day_goal:[
        {
            type: String,
            trim:true,
            maxLength:50,
            required: true
            //example chest, back, legs, like this
        }
    ],
    description:{
        type: String,
        trim: true,
        maxLength: 200
    },
    workout: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Exercise'            
        }
    ]
}, { timestamps: true });

const Day = mongoose.model('Day', day_schema);
module.exports = Day;