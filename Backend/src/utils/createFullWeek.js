const WeeklyPlan = require('../models/week');
const mongoose = require('mongoose');
const Exercise = require('../models/exercise');
const Day = require('../models/day');

const createDayWithExercises = async (dayData, session) => {
    const { day_name, day_goal, description, exercises } = dayData;

    // 1. Save exercises
    const savedExercises = await Exercise.insertMany(exercises, { session });

    // 2. Extract IDs
    const exerciseIds = savedExercises.map(ex => ex._id);

    // 3. Create day
    const newDay = await Day.create([{
        day_name,
        day_goal,
        description,
        workout: exerciseIds
    }], { session });

    return newDay[0]; // return single doc
};



const weekCreate = async (userId, weekData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const createdDays = [];

        // 🔥 loop through all days
        for (const day of weekData) {
            const newDay = await createDayWithExercises(day, session);
            createdDays.push(newDay._id);
        }

        // 🔹 check existing weekly plan
        let weeklyPlan = await WeeklyPlan.findOne({ userId }).session(session);

        if (weeklyPlan) {
            // overwrite existing days (better than push)
            weeklyPlan.days = createdDays;
            await weeklyPlan.save({ session });
        } else {
            // create new
            weeklyPlan = await WeeklyPlan.create([{
                userId,
                days: createdDays
            }], { session });
        }

        await session.commitTransaction();
        session.endSession();

        return weeklyPlan;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

module.exports = weekCreate;