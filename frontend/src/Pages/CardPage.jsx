import React from "react";
import ExDetailCard from "../component/ExDetailCard";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const CardPage = () => {
 const {data} = useSelector((state)=>state.workout)
 const {index} = useParams();
 const day_id = index;
 const day = data?.data?.days[index]
  if (!day) return <p>No Data Found</p>;

  const { day_name, day_goal, workout } = day;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      
      {/* Day Name */}
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-center">
        {day_name}
      </h1>

      {/* Goals */}
      <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center shadow-sm">
        <p className="text-lg md:text-xl font-semibold text-gray-800">
          {day_goal?.join(" & ")}
        </p>
      </div>

      {/* Goal-wise Sections */}
      <div className="flex flex-col gap-8">
        {day_goal?.map((goal, index) => {
          const filteredExercises = workout?.filter(
            (ex) =>
              ex.exercise_goal?.toLowerCase() === goal.toLowerCase()
          );

          if (!filteredExercises || filteredExercises.length === 0)
            return null;

          return (
            <ExDetailCard
              key={index}
              goal={goal}
              exercises={filteredExercises}
              day_name={day_name}
              day_id ={day_id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CardPage;