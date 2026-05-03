const exercise_validate = require('../utils/exercise_validation');
const Exercise = require('../models/exercise');

// CREATE
const create_exercise = async (req, res) => {
    try {
        exercise_validate(req.body);

        const doc = await Exercise.create(req.body);

        res.status(201).json({
            data: doc,
            message: "Exercise created successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

const create_many_exercise = async (req, res) => {
    try {
        // check array
        if (!Array.isArray(req.body) || req.body.length === 0) {
            throw new Error("Request body must be a non-empty array");
        }

        // validate each object
        req.body.forEach(item => exercise_validate(item));

        // insert all at once
        const docs = await Exercise.insertMany(req.body);

        res.status(201).json({
            data: docs,
            message: "Exercises created successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};
// UPDATE (complete object required)
const update_exercise = async (req, res) => {
    try {
        // full object validation
        exercise_validate(req.body);

        const doc = await Exercise.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,          // updated doc return kare
                runValidators: true // mongoose validation bhi chale
            }
        );

        if (!doc) {
            throw new Error("Exercise not found");
        }

        res.status(200).json({
            data: doc,
            message: "Exercise updated successfully"
        });

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};


// FIND (by ID)
const find_exercise = async (req, res) => {
    try {
        const doc = await Exercise.findById(req.params.id);

        if (!doc) {
            throw new Error("Exercise not found");
        }

        res.status(200).json({
            data: doc,
            message: "Exercise fetched successfully"
        });

    } catch (err) {
        res.status(404).json({
            error: err.message
        });
    }
};


// DELETE
const delete_exercise = async (req, res) => {
    try {

        const doc = await Exercise.findByIdAndDelete(req.params.id);
        console.log('backend',doc)

        if (!doc) {
            throw new Error("Exercise not found");
        }

        res.status(200).json({
            message: "Exercise deleted successfully"
        });

    } catch (err) {
        res.status(404).json({
            error: err.message
        });
    }
};


module.exports = {
    create_exercise,
    update_exercise,
    find_exercise,
    delete_exercise,
    create_many_exercise
};