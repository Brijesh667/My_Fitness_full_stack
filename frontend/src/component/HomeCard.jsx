import { useState } from "react"
import { useNavigate } from "react-router"
import { FaTrash } from "react-icons/fa";
import { Pencil } from "lucide-react";

export default function HomeCard({day_name, title,index})
{
    const [iscomplete,set_iscomplete] = useState('Start')
    const Navigate = useNavigate();

    function handleClick()
    {
        Navigate(`/day/${index}`);
    }

    return(
        <div className="
            w-full 
            sm:w-[300px] 
            bg-white 
            rounded-2xl 
            shadow-md 
            p-5 
            flex flex-col 
            justify-between 
            gap-4 
            hover:shadow-xl 
            transition-all 
            duration-300
        ">

            {/* Top section (edit button) */}
            <div className="flex justify-end">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                    <Pencil size={18} className="text-gray-600"/>
                </button>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center text-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {day_name}
                </h1>

                <h2 className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {title}
                </h2>
            </div>

            {/* Action button */}
            <div className="w-full">
                <button 
                    onClick={handleClick}
                    className="
                        w-full 
                        py-2.5 
                        bg-blue-500 
                        text-white 
                        rounded-lg 
                        font-medium
                        hover:bg-blue-600 
                        active:scale-95 
                        transition-all 
                        duration-200
                    "
                >
                    {iscomplete}
                </button>
            </div>

        </div>
    )
}