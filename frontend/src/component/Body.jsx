import HomeCard from "./HomeCard";
import { useSelector } from "react-redux";
import Today_workout from "./Today_workout";
import NoWorkoutPlan from "./noplan";
import {useNavigate} from 'react-router'

export default function Body()
{  
    const {data} = useSelector((state)=>state.workout)
    const navigate = useNavigate()

    if(!data)
        return(
            <>
                <NoWorkoutPlan/>
            </>
        )
    
    const today = new Date();
    const d = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const index1 = today.getDay();
    const dayName = d[index1];

    let workout = 'Not Set'
    const day_goal = data?.data?.days[index1]?.day_goal
    if(day_goal)
        workout = day_goal.join(" & ")

  return(
    <>
        <Today_workout day_name={dayName} workout={workout} index={index1} />

        <div id="body" className="w-full flex justify-center px-4 sm:px-6 lg:px-10 mt-8 sm:mt-10">

            {/* main container */}
            <div className="
                w-full 
                max-w-7xl 
                bg-gray-100 
                rounded-2xl 
                p-4 sm:p-6 lg:p-10 
                shadow-md
            ">

                {/* header */}
                <div className="
                    flex 
                    flex-col sm:flex-row 
                    items-center 
                    justify-between 
                    gap-4 
                    w-full 
                    bg-gray-800 
                    rounded-xl 
                    px-4 sm:px-6 lg:px-10 
                    py-4
                ">

                    <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-semibold tracking-wide text-center sm:text-left">
                        My Weekly Workout Plan  
                    </h1>

                    <button
                        onClick={()=>{navigate('/day/create')}}
                        className="
                            w-full sm:w-auto
                            px-5 py-2.5 
                            text-white 
                            font-medium 
                            rounded-lg 
                            bg-gradient-to-r from-blue-500 to-indigo-600 
                            hover:from-blue-600 hover:to-indigo-700 
                            shadow-md hover:shadow-xl 
                            active:scale-95
                            transition-all duration-300
                        ">
                        Change Plan
                    </button>

                </div>

                {/* cards grid */}
                <div className="
                    grid 
                    grid-cols-1 
                    sm:grid-cols-2 
                    lg:grid-cols-3 
                    gap-6 sm:gap-8 lg:gap-10 
                    mt-6 sm:mt-8 lg:mt-10
                ">

                    {data?.data?.days?.map((item,index)=>(
                        <HomeCard 
                            day_name={item?.day_name} 
                            title={item?.description} 
                            key={item?._id}
                            index = {index}
                        />
                    ))}

                </div>

            </div>

        </div>

    </>
)
}