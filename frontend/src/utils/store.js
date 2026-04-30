import { configureStore } from "@reduxjs/toolkit";
import authReducer from './authSlice';
import weekReducer from './workoutSlice'
export const auth_store = configureStore({
    reducer:{
        auth:authReducer,
        workout:weekReducer
    }

});
