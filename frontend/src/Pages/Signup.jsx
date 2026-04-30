import { useForm } from "react-hook-form";
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import { useDispatch, useSelector } from "react-redux";
import {registerUser} from '../utils/authSlice'
import { useEffect, useState } from "react";
import { useNavigate,NavLink } from 'react-router';

const signupSchema = z.object({
    firstName:z.string().min(3,'Minimum character should be 3'),
    lastName: z.string().min(1, 'Last name is required'),
    emailId:z.string().email("Invalid Email"),
    password:z.string().min(8,'Password is too weak'),
    age: z.string().refine((val) => {
        const num = parseInt(val);
        return num >= 13 && num <= 120;
    }, 'Age must be between 13 and 120'),
    gender: z.enum(['male', 'female', 'other'], 'Please select a gender')
})
export default function Signup()
{
    const [showPassword,setShowPassword] = useState(false)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {isAuthenticated,loading,error} = useSelector((state)=>state.auth)
    useEffect(()=>{
        if(isAuthenticated)
        {
            navigate('/')
        }
    },[isAuthenticated])

    const onSubmit = (data)=>{
        const submitData = { ...data, age: parseInt(data.age) };
        dispatch(registerUser(submitData));
    }

    const {
        register,
        handleSubmit,
        formState:{errors},
    } = useForm({resolver:zodResolver(signupSchema)});

   return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl sm:text-3xl mb-6">Sign Up</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* First Name Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                placeholder="John"
                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`} 
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className="text-error text-sm mt-1">{errors.firstName.message}</span>
              )}
            </div>

            {/* Last Name Field */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                placeholder="Doe"
                className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`} 
                {...register('lastName')}
              />
              {errors.lastName && (
                <span className="text-error text-sm mt-1">{errors.lastName.message}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`}
                {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
              )}
            </div>

            {/* Age Field */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Age</span>
              </label>
              <input
                type="number"
                placeholder="25"
                min="13"
                max="120"
                className={`input input-bordered w-full ${errors.age ? 'input-error' : ''}`} 
                {...register('age')}
              />
              {errors.age && (
                <span className="text-error text-sm mt-1">{errors.age.message}</span>
              )}
            </div>

            {/* Gender Field */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Gender</span>
              </label>
              <select
                className={`select select-bordered w-full ${errors.gender ? 'select-error' : ''}`}
                {...register('gender')}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <span className="text-error text-sm mt-1">{errors.gender.message}</span>
              )}
            </div>

            {/* Password Field with Toggle */}
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-sm mt-1">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <div className="form-control mt-8 flex justify-center"> 
              <button
                type="submit"
                className={`btn btn-primary w-full sm:w-auto ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Login Redirect */}
          <div className="text-center mt-6">
            <span className="text-sm">
              Already have an account?{' '}
              <NavLink to="/login" className="link link-primary">
                Login
              </NavLink>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

    










/*
    error object 

    const errors = {

        firstName:{
                type:'minLength',//kis type ka error hai
                message:'firstname should have atleast 3 char'// error message kya hai
        },
        emailId:{
            type:'invalid_string',
            message:'Invalid Email'
        }is type se multiple object aayenge iske andar

    and agar koi bhi error nehi aata hai to yeh sab undefine ke equal rahega like 
    firstName:undefined,
    emailid:undefined,
    password:undefined



  
    yeha par firstName, email, password key hai, yeh form ek object return karega, and jo ...register hai, wo acutally ek object return karta hai, jo ki 
    jaise ki ham value ko handle karte hai the ,yeh sab automatic handle kar deta hai, and yeha par 'firstName' ki value show hoti hai, 
    
    errors.firstName ? (<span>{errors.firstName.message}</span>):null}  iska bhi use kar sakte hai
    yeha par && ka matlb hai, ki agar pahla condition true hai then second condition ko return karega otherwise first 
    condition ko hi return kar dega, example console.log(2&&30) iska output 30 hoga, because
    && operation check karta hia, if condition 1 is true then return condition 2 otherwise return condition1 
    yeha par yeh nehi ho rha hia ki condition1 true hoga and condition2 bhi true hoga then yeh run hoga
       
    */






























//is form mai sab kuch menually handle karna padega, and jab bahut sare user honge to bahut sari state ho jayengi


// import { useState, useEffect } from "react"

// export default function Signup()
// {

//     const [name,setname] = useState('');
//     const [email,setemail] = useState('');
//     const [password,setpassword] = useState('');

//     function handleSubmit(e)
//     {
//         e.preventDefault();
//         //validation, frontend par ham validation use karenge, 
//         //backend mai bhi karenge, frontend mai is liye karenge ki koi user postman
//         //ke throw request mar sakte hai, is liye ham backend mai bhi
//         //check karte hai, taki koi invalid data store na ho, and data base par faltu ka load na pade

//         //is form ko backend mai submit karna hai, jiska api likhenge yeha

//         console.log(name,email,password)
 
//     }

//     return(
//         <>
//         <form onSubmit={handleSubmit}>
//             <input value={name} placeholder="Enter your name" onChange={(e)=>(setname(e.target.value))} ></input>
//             <input value={email} placeholder="Enter your email" onChange={(e)=>(setemail(e.target.value))} ></input>
//             <input value={password} placeholder="Enter your password" onChange={(e)=>(setpassword(e.target.value))} ></input>
//             <button type="submit">Submit</button>

//         </form>
//         </>
    
//     )
// }