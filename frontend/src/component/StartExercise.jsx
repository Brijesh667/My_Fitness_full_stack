import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

const StartExercise = () => {
  console.log('hello')
  const [time, setTime] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const {data} = useSelector((state)=>state.workout)
  const {index,day_id} = useParams();
  const exercise = data?.data?.days[day_id]?.workout[index] 
  console.log('hello bhai',exercise)
  // ⏱️ Timer Logic (ONLY ONE interval)
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // format time (mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // handlers
  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  if (!exercise) return <p>No Exercise Data</p>;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      
      {/* LEFT: TIMER */}
      <div className="w-full lg:w-1/3 flex flex-col items-center justify-center bg-white shadow-md p-6">
        
        <h2 className="text-xl font-bold mb-4">⏱ Timer</h2>

        <div className="text-4xl md:text-5xl font-mono mb-6">
          {formatTime(time)}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStart}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Start
          </button>

          <button
            onClick={handleStop}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
          >
            Stop
          </button>

          <button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* RIGHT: EXERCISE DETAILS */}
      <div className="w-full lg:w-2/3 p-6">
        
        <div className="bg-white rounded-xl shadow-md p-6">
          
          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {exercise.exercise_name}
          </h1>

          {/* Level */}
          <p className="text-gray-500 mb-3 capitalize">
            Level: {exercise.level}
          </p>

          {/* Description */}
          <p className="text-gray-700 mb-4">
            {exercise.exercise_description}
          </p>

          {/* Sets */}
          <h2 className="text-lg font-semibold mb-3">Sets</h2>

          <div className="space-y-3">
            {exercise.sets?.map((set, index) => (
              <div
                key={index}
                className="bg-gray-100 p-3 rounded-lg"
              >
                <p className="font-medium">
                  {set.set_name} - {set.reps} reps
                </p>
                <p className="text-sm text-gray-600">
                  {set.set_description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StartExercise;