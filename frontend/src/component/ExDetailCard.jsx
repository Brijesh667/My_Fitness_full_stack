import React from "react";

const ExDetailCard = ({ goal, exercises }) => {
  return (
    <div className="w-full">
      
      {/* Goal Title */}
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 border-l-4 border-blue-500 pl-3">
        🔥 {goal}
      </h2>

      {/* Exercise Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {exercises.map((ex, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition duration-300"
          >
            
            {/* Exercise Name */}
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              {ex.exercise_name}
            </h3>

            {/* Level */}
            <p className="text-sm text-gray-500 mb-2 capitalize">
              Level: {ex.level}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {ex.exercise_description}
            </p>

            {/* Sets */}
            <div className="space-y-2">
              {ex.sets?.map((set, i) => (
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
        ))}
      </div>
    </div>
  );
};

export default ExDetailCard;