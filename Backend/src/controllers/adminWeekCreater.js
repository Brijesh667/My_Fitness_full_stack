const  weekCreate  = require('../utils/createFullWeek');
const WeeklyPlan = require('../models/week');
//creat week
const createadminweek = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await weekCreate(userId, req.body);
    

    res.status(201).json({
      message: "Workout Plan created Successfully",
      data: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//find week
const admin_week = async (req, res) => {
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

module.exports = { createadminweek,admin_week };