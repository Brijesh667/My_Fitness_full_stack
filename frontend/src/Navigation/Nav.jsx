import { useNavigate } from "react-router"
const profile = new URL('../assets/profile.png', import.meta.url).href
const Logo = new URL('../assets/Logo.png', import.meta.url).href
import UseProfile from "../component/userProfile";
import { useSelector } from "react-redux";

export default function Nav(){
    const Navigate = useNavigate();
    const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);
   
    return (
  <div className="
    fixed top-0 left-0 
    w-full
    flex items-center justify-between 
    px-3 sm:px-6 lg:px-10 py-2 sm:py-3
    bg-white/20 backdrop-blur-md 
    border-b border-white/30 shadow-md 
    z-50
  ">

    {/* Logo */}
    <div className="flex items-center shrink-0">
      <img
        src={Logo}
        alt="logo"
        className="h-8 sm:h-10 lg:h-12 object-contain"
      />
    </div>

    {/* Navigation */}
    <div className="flex items-center gap-2 sm:gap-6 flex-1 justify-end">

        {/* Buttons */}
        <div className="
            flex items-center gap-2 sm:gap-4
            overflow-x-auto 
            no-scrollbar
            max-w-[60%] sm:max-w-none
        ">

        <button
            onClick={() => Navigate("/")}
            className="
            flex-shrink-0
            whitespace-nowrap
            px-2.5 sm:px-4 lg:px-6 py-1 sm:py-2
            rounded-lg 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 
            text-[11px] sm:text-sm lg:text-base
            font-medium 
            transition
            ">
            Home
        </button>

        <button
            onClick={() => Navigate("/workout_plan")}
            className="
            flex-shrink-0
            whitespace-nowrap
            px-2.5 sm:px-4 lg:px-6 py-1 sm:py-2
            rounded-lg 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 
            text-[11px] sm:text-sm lg:text-base
            font-medium 
            transition
            ">
            Workout Plan
        </button>

        <button
            onClick={() => Navigate("/Exercise_Library")}
            className="
            flex-shrink-0
            whitespace-nowrap
            px-2.5 sm:px-4 lg:px-6 py-1 sm:py-2
            rounded-lg 
            bg-white/40 backdrop-blur-md
            hover:bg-white/60 
            text-[11px] sm:text-sm lg:text-base
            font-medium 
            transition
            ">
            Exercise Library
        </button>

        </div>

        {/* Profile */}
        <div className="flex items-center shrink-0 ml-2 sm:ml-4">
        {isAuthenticated? <UseProfile />:<>
            <img
                src={profile}
                alt="profile"
                className="
                w-7 h-7 sm:w-10 sm:h-10 lg:w-11 lg:h-11 
                rounded-full object-cover 
                border border-white 
                hover:scale-105 
                transition
                "
            />
        </>}
        </div>
    </div>

  </div>
);
}