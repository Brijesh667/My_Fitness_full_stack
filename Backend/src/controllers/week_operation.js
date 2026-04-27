const WeeklyPlan = require('../models/week');
const validate_weekly_plan = require('../utils/week_validation');
const mongoose = require('mongoose');


// CREATE
const create_week = async (req, res) => {
    try {
        const userId = req.user._id;

        // body me userId inject kar
        const data = {
            ...req.body,
            userId
        };

      
        validate_weekly_plan(data);

        const doc = await WeeklyPlan.create(data);

        res.status(201).json({
            data: doc,
            message: "Weekly plan created successfully"
        });

    } catch (err) {

       
        if (err.code === 11000) {
            return res.status(400).json({
                error: "Weekly plan already exists for this user"
            });
        }

        res.status(400).json({
            error: err.message
        });
    }
};


const week_update = async (req, res) => {
    try {
        const userId = req.user._id;

        const data = {
            ...req.body,
            userId
        };


        validate_weekly_plan(data);

     
        if (data.days) {
            data.days.forEach(id => {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Invalid Day ID in days array");
                }
            });
        }

        const doc = await WeeklyPlan.findOneAndUpdate(
            { userId },
            data,
            {
                new: true,
                runValidators: true
            }
        );

        if (!doc) {
            return res.status(404).json({
                error: "Weekly plan not found"
            });
        }

        res.status(200).json({
            data: doc,
            message: "Weekly plan updated successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

const find_week = async (req, res) => {
    try {
        const userId = req.user._id;

        const doc = await WeeklyPlan.findOne({ userId })
            .populate({
                path: 'days',
                populate: {
                    path: 'workout',
                    model: 'Exercise'
                }
            });

        if (!doc) {
            return res.status(404).json({
                error: "Weekly plan not found"
            });
        }

        res.status(200).json({
            data: doc,
            message: "Weekly plan fetched successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};


module.exports = {
    create_week,
    week_update,
    find_week
};