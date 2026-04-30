import HomeCard from "./HomeCard";
import { useSelector } from "react-redux";
import Today_workout from "./Today_workout";


export default function Body()
{  const {data} = useSelector((state)=>state.workout)
   
    
  

  
    const today = new Date();
    const d = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const index1 = today.getDay();
    const dayName = d[index1];
   
    const day_goal = data?.data?.days[index1].day_goal
    
    const workout = day_goal.join(' & ')
  return(
    <>
        <Today_workout day_name={dayName} workout={workout} index={index1} />
        <div id="body" className="w-full flex justify-center mt-10">

            {/* main container */}
            <div className="w-[85%] bg-gray-100 rounded-2xl p-10 shadow-md">

                {/* header */}
                <div className="flex justify-between w-full h-16 bg-gray-700 flex items-center  rounded-lg pl-10 pr-10 ">

                    <h1 className="text-white text-xl font-bold tracking-wide">
                        My Weekly Workout Plan  
                    </h1>

                <button className="px-6 py-2 text-white font-semibold rounded-lg 
                        bg-gradient-to-r from-blue-500 to-indigo-600 
                        hover:from-blue-600 hover:to-indigo-700 
                        shadow-md hover:shadow-xl transition-all duration-300">
                        Change Plan
                    </button>

                </div>


                {/* cards grid */}
                <div className="grid grid-cols-3 gap-10 mt-10 place-items-center">

                    {data?.data?.days?.map((item,index)=>(
                        <HomeCard 
                            day_name={item?.day_name} 
                            title={item?.description} 
                            key={index}
                            index = {index}
                        />
                    ))}

                </div>

            </div>

        </div>

    </>
)
}