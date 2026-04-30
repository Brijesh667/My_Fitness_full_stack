import { useState } from "react"
import { useNavigate } from "react-router"


export default function HomeCard({day_name, title,index})
{
    const [iscomplete,set_iscomplete] = useState('Start')
    const Navigate = useNavigate();

    function handleClick()
    {
        Navigate(`/card/${index}`);
    }


  

    return(
        <div className="bg-white w-[280px] rounded-xl shadow-md p-5 flex flex-col items-center gap-3 hover:shadow-lg transition">

    <div>
        <h1 className="text-xl font-bold text-gray-800">
            {day_name}
        </h1>
    </div>

    <div>
        <h2 className="text-gray-600 text-center">
            {title}
        </h2>
    </div>

    <div>
        <button 
            onClick={handleClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
            {iscomplete}
        </button>
    </div>

</div>
    )
}