// models/exercise.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const exercise_schema = new Schema({
    exercise_name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    exercise_goal: {
        type: String,
        trim:true,
        required: true,
        maxLength:50
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'everyone'],
        default: 'everyone'
    },
    sets: [
        {
            set_name: {
                type: String,
                trim: true,
                maxLength: 30,
                required: true          // e.g. "Warm-up Set", "Working Set"
            },
            reps: {
                type: Number,
                required: true,
                min: 1,
                max: 100
            },
            set_description: {
                type: String,
                trim: true,
                maxLength: 100
            }
        }
    ],
    exercise_description: {
        type: String,
        trim: true,
        maxLength: 300
    }
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', exercise_schema);
module.exports = Exercise;