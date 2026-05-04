import React from "react";
import ExDetailCard from "../component/ExDetailCard";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
const CardPage = () => {
 const {data} = useSelector((state)=>state.workout)
 const {index} = useParams();
 const navigate = useNavigate()
 const day_id = index;
 const day = data?.data?.days[index]
 const [show, setShow] = useState(false);
 const [goal,setgoal] = useState(null)
  if (!day) return <p>No Data Found</p>;
    const {
      register,
      formState: { errors },
    } = useForm();

  const { day_name, day_goal, workout, _id } = day;
  const goal1 = day_goal[0]
  const goal2 = day_goal[1]
  function handleButton(){
    if(!show)
      setShow(true);
    else{
      setShow(false)
      navigate(`/add/${day_name}/${goal}/${_id}`)
    }
    

  }
//navigate(`/add/${day_name}/${day_goal}/${_id}`)
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      
      {/* Day Name */}
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-center">
        {day_name}
      </h1>

    {/* Goals */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-100 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">

  {/* Goal Text */}
  <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 text-center md:text-left">
    {day_goal?.join(" & ")}
  </p>

  {/* Action Section */}
  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

    <button
      onClick={handleButton}
      className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg text-sm md:text-base font-medium hover:bg-gray-800 transition duration-200"
    >
      Add Exercise
    </button>

    {show && (
      <select
        {...register("goal")}
        onChange={(e) => setgoal(e.target.value)}
        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Select Goal</option>
        <option value={goal1}>{goal1}</option>
        <option value={goal2}>{goal2}</option>
      </select>
    )}

  </div>
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
              _id={_id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CardPage;