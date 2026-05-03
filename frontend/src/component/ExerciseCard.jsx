import React from "react";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axiosClient"; 
import { getWeekWorkout } from "../utils/workoutSlice";
import { useDispatch } from "react-redux";
import { MdDelete } from "react-icons/md";

const ExerciseCard = ({ exercise, index, day_name, goal, day_id, _id }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const exercise_name = exercise.exercise_name;
  const handleDelete = async () => {

  try {
    console.log(_id)
    await axiosClient.delete(`/exercise/delete/${_id}`);
    dispatch(getWeekWorkout())
    
  } catch (err) {
    console.error(err);
  }
};  


  return (
    <div className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      
        <div className="flex justify-between items-center w-full mt-2">
  
  {/* Delete Button */}
  <button 
    onClick={handleDelete} 
    className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
  >
    <MdDelete className="text-lg" />
  </button>

  {/* Edit Button */}
  <button 
    onClick={() => {navigate('/')}} 
    className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
  >
    <Pencil />
  </button>

</div>
      <div>
        {/* Exercise Name */}
        <h3 className="text-xl font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition">
          {exercise.exercise_name}
        </h3>

        {/* Level */}
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          {exercise.level}
        </p>

        {/* Description (truncate) */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {exercise.exercise_description}
        </p>

        {/* Sets (only 3) */}
        <div className="space-y-2 mb-3">
          {exercise.sets?.slice(0, 3).map((set, i) => (
            <div
              key={i}
              className="bg-gray-50 hover:bg-gray-100 transition p-2 rounded-lg text-sm border"
            >
              <p className="font-medium text-gray-800">
                {set.set_name} • {set.reps} reps
              </p>
              <p className="text-gray-500 text-xs line-clamp-1">
                {set.set_description}
              </p>
            </div>
          ))}
        </div>

        {/* Optional: show more indicator */}
        {exercise.sets?.length > 3 && (
          <p className="text-xs text-gray-400">
            +{exercise.sets.length - 3} more sets
          </p>
        )}
      </div>

      {/* Button */}
      <button
        onClick={() => {
          navigate(`/day/${day_name}/${day_id}/${goal}/${exercise_name}/${index}`);
        }}
        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm py-2.5 px-4 rounded-xl font-medium transition-all duration-200 active:scale-95"
      >
        Start Workout
      </button>
    </div>
  );
};

export default ExerciseCard;