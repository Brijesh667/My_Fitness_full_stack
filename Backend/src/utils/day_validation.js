const validate_day = (data) => {

  
    const validDays = [
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];


    if (!data.day_name || !data.day_goal) {
        throw new Error("day_name and day_goal are required");
    }

    
    if (!validDays.includes(data.day_name)) {
        throw new Error("Invalid day_name");
    }


   // Validate day_goal as array of strings
        if (!Array.isArray(data.day_goal) || data.day_goal.length === 0) {
            throw new Error("day_goal must be a non-empty array");
        }

        if (!data.day_goal.every(goal => typeof goal === "string" && goal.trim().length > 0 && goal.length <= 50)) {
            throw new Error("Each day_goal must be a non-empty string (max 50 characters)");
        }

 
    if (data.description && data.description.length > 200) {
        throw new Error("description max 200 characters");
    }

    if (data.workout) {
        if (!Array.isArray(data.workout)) {
            throw new Error("workout must be an array");
        }

        data.workout.forEach((id, index) => {
       
            if (!id || typeof id !== "string") {
                throw new Error(`workout[${index}] must be a valid ObjectId string`);
            }
        });
    }

};

module.exports = validate_day;