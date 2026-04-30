import React from "react";
import { useNavigate } from "react-router";
const ExerciseCard = ({ exercise, index,day_name,goal,day_id}) => {
  const Navigate = useNavigate();
  const exercise_name = exercise.exercise_name;
  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition duration-300 flex flex-col justify-between">
      
      <div>
        {/* Exercise Name */}
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {exercise.exercise_name}
        </h3>

        {/* Level */}
        <p className="text-sm text-gray-500 mb-2 capitalize">
          Level: {exercise.level}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">
          {exercise.exercise_description}
        </p>

        {/* Sets */}
        <div className="space-y-2 mb-3">
          {exercise.sets?.map((set, i) => (
            <div
              key={i}
              className="bg-gray-50 p-2 rounded-md text-sm"
            >
              <p className="font-medium">
                {set.set_name} - {set.reps} reps
              </p>
              <p className="text-gray-500">
                {set.set_description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Button */}
      <button
        onClick={()=>{Navigate(`/day/${day_name}/${day_id}/${goal}/${exercise_name}/${index}`)}}
        className="mt-auto bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-lg transition"
      >
       Start
      </button>
    </div>
  );
};

export default ExerciseCard;