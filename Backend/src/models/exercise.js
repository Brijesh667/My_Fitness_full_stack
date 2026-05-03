// models/exercise.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
// ✅ Removed unused `Day` import — avoids circular dependency

const exercise_schema = new Schema({
    exercise_name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    exercise_goal: {
        type: String,
        trim: true,
        required: true,
        maxLength: 50
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
                required: true
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


exercise_schema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model('Day').updateMany(
            { workout: { $in: [doc._id] } },  // ✅ correct way to search inside an array
            { $pull: { workout: doc._id } }
        );
    }
});

const Exercise = mongoose.model('Exercise', exercise_schema);
module.exports = Exercise;