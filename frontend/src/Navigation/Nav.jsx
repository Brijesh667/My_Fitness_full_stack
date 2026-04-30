import { useNavigate } from "react-router"
const profile = new URL('../assets/profile.png', import.meta.url).href
const Logo = new URL('../assets/Logo.png', import.meta.url).href
import UseProfile from "../component/userProfile";
import { useSelector } from "react-redux";


export default function Nav(){
    const Navigate = useNavigate();
    const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);
   
    return (
  <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[100%] 
  flex items-center justify-between px-8 py-3
  bg-white/20 backdrop-blur-md 
  border border-white/30 shadow-lg 
  z-10">

    {/* Logo */}
    <div className="flex items-center w-[30%]">
      <img
        src={Logo}
        alt="logo"
        className="w-30 h-15 object-cover rounded-lg"
      />
    </div>

    {/* Navigation */}

    <div className="flex justify-around w-[60%]">
        <div className="flex items-center gap-6">

        <button
            onClick={() => Navigate("/")}
            className="px-6 py-2 rounded-xl 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 transition font-medium">
            Home
        </button>

        <button
            onClick={() => Navigate("/workout_plan")}
            className="px-6 py-2 rounded-xl 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 transition font-medium">
            Workout Plan
        </button>

        <button
            onClick={() => Navigate("/Exercise_Library")}
            className="px-6 py-2 rounded-xl 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 transition font-medium">
            Exercise Library
        </button>

        </div>

        {/* Profile */}
        <div>
        {isAuthenticated? <UseProfile />:<><img
            src={profile}
            alt="profile"
            className="w-12 h-12 rounded-full object-cover 
            border-2 border-white hover:scale-105 transition"
        /></>}
        </div>
    </div>

  </div>
);
}