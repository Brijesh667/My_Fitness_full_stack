import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

const StartExercise = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const { data } = useSelector((state) => state.workout);
  const { index, day_id } = useParams();

  const exercise = data?.data?.days[day_id]?.workout[index];

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  if (!exercise) return <p className="p-6">No Exercise Data</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        
        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">

          {/* TIMER CARD (compact) */}
          <div className="bg-white rounded-2xl shadow-md p-5 w-full max-w-sm">
            
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Timer
            </h2>

            <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
              {formatTime(time)}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStart}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-md text-sm transition active:scale-95"
              >
                Start
              </button>

              <button
                onClick={handleStop}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded-md text-sm transition active:scale-95"
              >
                Stop
              </button>
            </div>

            <button
              onClick={handleReset}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-md text-sm transition active:scale-95"
            >
              Reset
            </button>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">
              {exercise.exercise_name}
            </h1>

            {/* Level */}
            <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide">
              {exercise.level}
            </p>

            {/* Description */}
            <p className="text-gray-700 mb-6 leading-relaxed">
              {exercise.exercise_description}
            </p>

            {/* Sets */}
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Workout Sets
            </h2>

            <div className="space-y-4">
              {exercise.sets?.map((set, i) => (
                <div
                  key={i}
                  className="border rounded-xl p-4 hover:shadow-sm transition bg-gray-50"
                >
                  <p className="font-semibold text-gray-800">
                    {set.set_name} • {set.reps} reps
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {set.set_description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StartExercise;