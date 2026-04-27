const { createDayAndAttachToWeek } = require('../utils/save_full_day');

const createDayWorkoutController = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await createDayAndAttachToWeek(userId, req.body);

    res.status(201).json({
      message: "Day added to weekly plan",
      data: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createDayWorkoutController };