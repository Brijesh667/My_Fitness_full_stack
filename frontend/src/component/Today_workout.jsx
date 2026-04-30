import { useNavigate } from "react-router"

export default function Today_workout({day_name, workout,index})
{
    const Navigate = useNavigate();
    return(
        <div className="flex w-full bg-white justify-center h-[300px] mt-10">
        <div className="w-[85%] bg-gray-100 py-20 flex justify-center items-center rounded-3xl">

            {/* Card */}
            <div className="w-[700px] bg-white rounded-2xl shadow-xl border border-gray-200 p-10 text-center space-y-6">

                <h1 className="text-3xl font-semibold text-gray-800">
                    Today's Workout
                </h1>

                <h3 className="text-xl text-gray-600">
                    {day_name}: <span className="font-medium text-gray-800">{workout}</span>
                </h3>

                <button
                className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 transition duration-300 shadow-md" 
                onClick={()=> Navigate(`/day/${index}`)}>
                    Start Workout
                </button>

            </div>

        </div>
        </div>

    )
}