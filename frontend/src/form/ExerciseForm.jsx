import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const exerciseValidationSchema = z.object({
    exerciseName: z
        .string()
        .min(1, 'Exercise name is required')
        .max(50, 'Exercise name must be less than 50 characters'),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'everyone']),
    exerciseDescription: z
        .string()
        .max(300, 'Exercise description must be less than 300 characters')
        .optional()
});

const ExerciseForm = ({ dayGoal, onClose }) => {
    const [sets, setSets] = useState([]);
    const [showSetInput, setShowSetInput] = useState(false);
    const [reps, setReps] = useState('');
    const [setDescription, setSetDescription] = useState('');

    const { control, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(exerciseValidationSchema),
        defaultValues: {
            exerciseName: '',
            level: 'everyone',
            exerciseDescription: ''
        }
    });

    const addSet = () => {
        if (reps) {
            const nextSetNumber = sets.length + 1;
            setSets([...sets, { set_name: `Set ${nextSetNumber}`, reps: parseInt(reps, 10), set_description: setDescription.trim() }]);
            setReps('');
            setSetDescription('');
            setShowSetInput(false);
        }
    };

    const removeSet = (index) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    const onSubmit = (data) => {
        const formData = {
            ...data,
            sets
        };
        console.log({
            dayGoal,
            ...formData
        });
        alert(`Exercise "${formData.exerciseName}" saved for goal: ${dayGoal}`);
        reset();
        setSets([]);
        onClose?.();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full p-6 bg-linear-to-br from-slate-50 to-white shadow-md rounded-2xl border border-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Add Exercise</h3>
                    <p className="text-sm text-slate-500">For: <span className="font-semibold text-slate-800">{dayGoal}</span></p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 font-semibold text-lg"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-slate-700 text-sm font-semibold mb-2">Exercise Name *</label>
                <Controller
                    name="exerciseName"
                    control={control}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="text"
                            className={`w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 ${errors.exerciseName ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-sky-500'
                                }`}
                            placeholder="Enter exercise name"
                        />
                    )}
                />
                {errors.exerciseName && <p className="text-red-600 text-xs mt-1">{errors.exerciseName.message}</p>}
            </div>



            <div className="mb-5">
                <label className="block text-slate-700 text-sm font-semibold mb-2">Level</label>
                <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                        <select
                            {...field}
                            className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="everyone">Everyone</option>
                        </select>
                    )}
                />
            </div>

            <div className="mb-5">
                <label className="block text-slate-700 text-sm font-semibold mb-3">Sets</label>
                <div className="space-y-2">
                    {sets.map((set, index) => (
                        <div key={index} className="px-4 py-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-start justify-between">
                            <div className="text-slate-700">
                                <div className="font-semibold">{set.set_name}</div>
                                <div className="text-sm text-slate-600">{set.reps} reps</div>
                                {set.set_description && <div className="text-sm text-slate-600">{set.set_description}</div>}
                            </div>
                            {sets.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeSet(index)}
                                    className="text-red-600 hover:text-red-800 font-semibold ml-2"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setShowSetInput(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-semibold text-sm"
                >
                    Add Set
                </button>

                {showSetInput && (
                    <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                            <p className="text-slate-700 text-sm font-semibold mb-2">Set {sets.length + 1}</p>
                            <p className="text-slate-500 text-xs">Set name will be automatically assigned</p>
                        </div>
                        <input
                            type="number"
                            placeholder="Enter reps"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            min="1"
                            max="100"
                            className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <input
                            type="text"
                            placeholder="Set description (optional)"
                            value={setDescription}
                            onChange={(e) => setSetDescription(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                            type="button"
                            onClick={addSet}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl font-semibold"
                        >
                            Save Set
                        </button>
                    </div>
                )}


            </div>

            <div className="mb-6">
                <label className="block text-slate-700 text-sm font-semibold mb-2">Exercise Description</label>
                <Controller
                    name="exerciseDescription"
                    control={control}
                    render={({ field }) => (
                        <textarea
                            {...field}
                            className={`w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 ${errors.exerciseDescription ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-sky-500'
                                }`}
                            maxLength="300"
                            rows="3"
                            placeholder="Describe this exercise (optional)"
                        />
                    )}
                />
                {errors.exerciseDescription && <p className="text-red-600 text-xs mt-1">{errors.exerciseDescription.message}</p>}
            </div>

            <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl"
            >
                Save Exercise
            </button>
        </form>
    );
};

export default ExerciseForm;