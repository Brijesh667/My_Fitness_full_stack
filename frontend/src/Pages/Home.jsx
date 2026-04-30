import { useEffect } from "react";
import { getWeekWorkout } from "../utils/workoutSlice";
import { useDispatch, useSelector } from 'react-redux';
  
export default function Home()
{
  const dispatch = useDispatch();
  const {data,loading} = useSelector((state)=>state.workout);

  // check initial authentication
  useEffect(() => {
    dispatch(getWeekWorkout());
  }, [dispatch]);

  if(loading)
    return(<h1>loading</h1>)

  console.log(data)
  return(

    <h1>I am home page</h1>
  )
}