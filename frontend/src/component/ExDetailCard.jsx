import React from "react";
import ExerciseCard from "./ExerciseCard";
import { useNavigate } from "react-router"

const ExDetailCard = ({ goal, exercises,day_name,day_id,_id }) => {

  const navigate = useNavigate();

  return (
    <div className="w-full">
      
      {/* Goal Title */}
      <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 border-l-4 border-blue-500 pl-3">
       {goal}
      </h2>
 
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {exercises.map((ex, index) => (
          <ExerciseCard
            key={ex?._id}
            exercise={ex}
            index={index}
            day_name={day_name}
            goal={goal}
            day_id ={day_id}
            _id={ex?._id}
          />
        ))}
      </div>
    </div>
  );
};

export default ExDetailCard;