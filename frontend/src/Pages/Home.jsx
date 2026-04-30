import { useEffect, useState } from "react"
import gym_image from '../assets/Gym_image.jsx'
import GymQuotes from "../assets/GymQuotes.jsx"
import HomeCard from "../component/HomeCard.jsx";
import { useSelector } from "react-redux";
import { decodeAsync } from "zod";



export default function HomePage(){
    
    const [index,set_index] = useState(0);
    useEffect(()=>{
        const interval = setInterval(()=>{
            const i = Math.floor(Math.random()*9)
            set_index(i)
        },2000)

        return ()=>clearInterval(interval)

    },[])
    const scrollToSection = (id)=>{
        document.getElementById(id).scrollIntoView({
            behavior:"smooth"
        })
    }
  

    return(

        <div id="home" className="relative w-full h-[100vh] overflow-hidden">

            <div className="absolute bottom-80 left-10">
                <button
                onClick={()=>scrollToSection("body")} 
                className="px-8 py-4 bg-green-500 text-white font-semibold rounded-[20px] shadow-lg 
                hover:bg-green-600 hover:scale-105 active:scale-95 
                transition-all duration-200">
                    Go your weekly plan
                </button>
            </div>
            <div className="absolute bottom-16 left-10 bg-black/50 backdrop-blur-sm px-6 py-4 rounded-lg max-w-[700px]">

                <p className="text-white text-2xl font-medium">
                    {GymQuotes[index]}
                </p>

            </div>
            <img
                className="w-full h-full object-cover"
                src={gym_image[index]}
                alt="gym"
            />


        </div>
    )
}