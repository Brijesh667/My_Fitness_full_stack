// models/weeklyPlan.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const weeklyPlan_schema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true   // ek user ka ek hi active weekly plan
    },

    days: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Day'
        }
    ],

}, { timestamps: true });

const WeeklyPlan = mongoose.model('WeeklyPlan', weeklyPlan_schema);
module.exports = WeeklyPlan;