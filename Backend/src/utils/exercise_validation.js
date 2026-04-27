const exercise_validate = (data) => {

    // Mandatory check
    if (!data.exercise_name || !data.exercise_goal || !data.sets) {
        throw new Error('Required fields missing');
    }

    // Exercise name
    if (data.exercise_name.length > 50) {
        throw new Error('Exercise name max 50 characters');
    }

    // Exercise goal
    if (data.exercise_goal.length > 50) {
        throw new Error('Exercise goal max 50 characters');
    }

    // Sets validation
    if (!Array.isArray(data.sets) || data.sets.length === 0) {
        throw new Error('At least one set is required');
    }

    data.sets.forEach((set, index) => {

        if (!set.set_name || set.set_name.length > 30) {
            throw new Error(`Set ${index + 1}: set_name max 30 characters`);
        }

        if (typeof set.reps !== 'number' || set.reps < 1 || set.reps > 100) {
            throw new Error(`Set ${index + 1}: reps must be between 1-100`);
        }

        if (set.set_description && set.set_description.length > 100) {
            throw new Error(`Set ${index + 1}: description max 100 characters`);
        }
    });

    // Exercise description
    if (data.exercise_description && data.exercise_description.length > 300) {
        throw new Error('Exercise description max 300 characters');
    }

};

module.exports = exercise_validate;