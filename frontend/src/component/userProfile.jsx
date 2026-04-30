import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from "../utils/authSlice";
const profileImg = new URL('../assets/profile.png', import.meta.url).href;

const UseProfile = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state)=>state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();
    console.log(user)
  // toggle
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // click outside close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  function handlbutton(){
    dispatch(logoutUser())
  }
  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Profile Image */}
      <img
        src={profileImg}
        alt="profile"
        onClick={handleToggle}
        className="w-12 h-12 rounded-full object-cover 
        border-2 border-white hover:scale-105 transition cursor-pointer"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg p-4 z-50">
          
          {/* User Info */}
          <div className="mb-3">
            <p className="font-semibold text-gray-800">{`Name: ${user?.firstName}`}</p>
            <p className="text-sm text-gray-500">{`Age: ${user?.age}`}</p>
          </div>

          {/* Divider */}
          <div className="border-t my-2"></div>

          {/* Logout Button */}
          <button
            onClick={handlbutton}
            className="w-full text-left px-3 py-2 rounded-lg 
            bg-red-500 text-white hover:bg-red-600 transition"
          >
            Logout
          </button>

        </div>
      )}
    </div>
  );
};

export default UseProfile;