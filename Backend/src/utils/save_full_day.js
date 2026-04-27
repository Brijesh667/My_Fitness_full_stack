const mongoose = require('mongoose');
const Exercise = require('../models/exercise');
const Day = require('../models/day');
const WeeklyPlan = require('../models/week');

const createDayAndAttachToWeek = async (userId, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { day_name, day_goal, description, exercises } = data;

    // week exists or not 
    let week = await WeeklyPlan.findOne({ userId }).session(session);


    if (week) {
      const existingDay = await Day.findOne({
        _id: { $in: week.days },
        day_name: day_name
      }).session(session);

      if (existingDay) {
        throw new Error("Day already exists. Cannot create duplicate.");
      }
    }

    //Save exercises
    const savedExercises = await Exercise.insertMany(exercises, { session });
    const exerciseIds = savedExercises.map(ex => ex._id);

    //Create Day
    const newDay = await Day.create([{
      day_name,
      day_goal,
      description,
      workout: exerciseIds
    }], { session });

    const dayId = newDay[0]._id;

    //Create or update week
    if (week) {
      week.days.push(dayId);
      await week.save({ session });
    } else {
      week = await WeeklyPlan.create([{
        userId,
        days: [dayId]
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    return { dayId, week };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = { createDayAndAttachToWeek };