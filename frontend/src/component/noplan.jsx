import { useNavigate } from "react-router";
const NoWorkoutPlan = () => {
    const navigate = useNavigate()
  return (
    <div className="w-full min-h-[300px] flex items-center justify-center border border-gray-200 rounded-2xl bg-gray-50 p-4 sm:p-6">

      <div className="text-center max-w-md w-full">

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
          No Work Plan
        </h2>

        {/* Content div (P + Button together) */}
        <div className="flex flex-col items-center gap-4 mt-4">

          <p className="text-gray-500 text-sm sm:text-base">
            Add your workout and start building your fitness journey
          </p>

          <button
            onClick={()=>{navigate('/day/create')}}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Add Workout Plan
          </button>

        </div>

      </div>
    </div>
  );
};

export default NoWorkoutPlan;