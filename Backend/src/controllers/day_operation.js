const mongoose = require('mongoose');
const Day = require('../models/day');
const validate_day = require('../utils/day_validation');

const create_day = async (req, res) => {
    try {
        validate_day(req.body);

        if (req.body.workout) {
            req.body.workout.forEach((id) => {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Invalid exercise ID in workout");
                }
            });
        }

        const doc = await Day.create(req.body);

        res.status(201).json({
            data: doc,
            message: "Day created successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};
const get_day = async (req, res) => {
    try {
       
        if (!req.params.id) {
            throw new Error("Day ID is required");
        }

    
        const doc = await Day.findById(req.params.id).populate('workout');

  
        if (!doc) {
            return res.status(404).json({
                error: "Day not found"
            });
        }

     
        res.status(200).json({
            data: doc,
            message: "Day fetched successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

const update_day = async (req, res) => {
    try {
       
        if (!req.params.id) {
            throw new Error("Day ID is required");
        }

      
        validate_day(req.body);

       
        if (req.body.workout) {
            req.body.workout.forEach(id => {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Invalid exercise ID in workout");
                }
            });
        }

       
        const doc = await Day.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('workout');

      
        if (!doc) {
            return res.status(404).json({
                error: "Day not found"
            });
        }

       
        res.status(200).json({
            data: doc,
            message: "Day updated successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

module.exports = { update_day };

module.exports = { create_day,get_day, update_day};