const mongoose = require('mongoose');

const validate_weekly_plan = (data) => {


    if (!data.userId) {
        throw new Error("userId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
        throw new Error("Invalid userId");
    }


    if (data.days) {
        if (!Array.isArray(data.days)) {
            throw new Error("days must be an array");
        }

        data.days.forEach((id, index) => {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid Day ID at index ${index}`);
            }
        });
    }
};

module.exports = validate_weekly_plan;