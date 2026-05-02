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
        <div id="home" className="relative w-full h-screen overflow-hidden">

            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />

            {/* CTA Button */}
            <div className="
                absolute z-20
                bottom-32 sm:bottom-40 lg:bottom-44 
                left-4 sm:left-8 lg:left-12
            ">
                <button
                onClick={()=>scrollToSection("body")} 
                className="
                    px-5 sm:px-6 lg:px-8 
                    py-3 sm:py-3.5 lg:py-4 
                    bg-green-500 
                    text-white 
                    text-sm sm:text-base lg:text-lg
                    font-semibold 
                    rounded-xl sm:rounded-2xl 
                    shadow-lg 
                    hover:bg-green-600 
                    hover:scale-105 
                    active:scale-95 
                    transition-all duration-200
                ">
                    Go your weekly plan
                </button>
            </div>

            {/* Quote box */}
            <div className="
                absolute z-20
                bottom-6 sm:bottom-10 lg:bottom-16 
                left-4 sm:left-8 lg:left-12
                bg-black/50 backdrop-blur-md 
                px-4 sm:px-5 lg:px-6 
                py-3 sm:py-4 
                rounded-lg 
                max-w-[90%] sm:max-w-[600px] lg:max-w-[700px]
            ">

                <p className="
                    text-white 
                    text-base sm:text-xl lg:text-2xl 
                    font-medium 
                    leading-relaxed
                ">
                    {GymQuotes[index]}
                </p>

            </div>

            {/* Background Image */}
            <img
                className="w-full h-full object-cover scale-105"
                src={gym_image[index]}
                alt="gym"
            />

        </div>
    )
}