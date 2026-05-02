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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8">

        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-6">
          Sign Up
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              placeholder="John"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              placeholder="Doe"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emailId ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('emailId')}
            />
            {errors.emailId && (
              <p className="text-red-500 text-xs mt-1">{errors.emailId.message}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              placeholder="25"
              min="13"
              max="120"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('age')}
            />
            {errors.age && (
              <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('gender')}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('password')}
              />

              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0" />
                  </svg>
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-semibold text-white transition ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>

        </form>

        {/* Redirect */}
        <div className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <NavLink to="/login" className="text-blue-600 hover:underline font-medium">
            Login
          </NavLink>
        </div>

      </div>
    </div>
  );
}