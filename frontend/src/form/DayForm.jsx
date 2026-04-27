import React, { useState } from 'react';
import ExerciseForm from './ExerciseForm';

const DayForm = () => {
    const [dayName, setDayName] = useState('Monday');
    const [dayGoals, setDayGoals] = useState([]);
    const [description, setDescription] = useState('');
    const [showGoalInput, setShowGoalInput] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [expandedGoal, setExpandedGoal] = useState(null);

    const addGoal = () => {
        if (dayGoals.length < 2 && goalInput.trim()) {
            setDayGoals([...dayGoals, goalInput.trim()]);
            setGoalInput('');
            setShowGoalInput(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({
            dayName,
            dayGoals,
            description
        });
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 bg-white shadow-lg rounded-2xl border border-slate-200">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">Create a Day</h2>
                    <p className="text-sm text-slate-500">Select a day, add up to two goals, then expand each goal to add exercises.</p>
                </div>

                <div className="mb-5">
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Day Name</label>
                    <select
                        value={dayName}
                        onChange={(e) => setDayName(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>

                <div className="mb-5">
                    <label className="block text-slate-700 text-sm font-semibold mb-3">Day Goals</label>
                    <div className="space-y-3">
                        {dayGoals.map((goal, index) => (
                            <div key={index} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-900 font-semibold text-lg">Goal {index + 1}: {goal}</span>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedGoal(expandedGoal === index ? null : index)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                                    >
                                        {expandedGoal === index ? '✕ Close' : '+ Add Exercise'}
                                    </button>
                                </div>

                                {expandedGoal === index && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <ExerciseForm
                                            dayGoal={goal}
                                            onClose={() => setExpandedGoal(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {dayGoals.length < 2 && (
                        <div className="mt-4">
                            {!showGoalInput ? (
                                <button
                                    type="button"
                                    onClick={() => setShowGoalInput(true)}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-2xl font-semibold"
                                >
                                    Add Goal
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        placeholder="Enter goal name (e.g. chest, back)"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={addGoal}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl font-semibold"
                                        >
                                            Save Goal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowGoalInput(false); setGoalInput(''); }}
                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-2xl font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {dayGoals.length === 2 && (
                        <p className="mt-3 text-sm text-slate-500">Maximum of 2 goals reached.</p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        maxLength="200"
                        rows="4"
                        placeholder="Describe the focus of this day"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl"
                >
                    Save Day
                </button>
            </div>
        </form>
    );
};

export default DayForm;