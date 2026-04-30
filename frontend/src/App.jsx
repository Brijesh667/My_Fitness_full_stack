import {Routes, Route ,Navigate} from "react-router";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import HomePage from "./Pages/Home";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./utils/authSlice";
import {getWeekWorkout} from './utils/workoutSlice'
import { useEffect } from "react";
import Nav from './Navigation/Nav'
import Body from "./component/Body";
import Footer from "./component/footer";
import CardPage from './Pages/CardPage'

function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);
  const {data} = useSelector((state)=>state.workout)

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
    dispatch(getWeekWorkout());

  }, [dispatch]);



  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return(
  <>
    <Nav></Nav>
    <Routes>
      <Route path="/" element={isAuthenticated ?<><HomePage></HomePage><Body/><Footer/></>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/card/:index" element={isAuthenticated?<CardPage/>:<Navigate to="/" />}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      
      {/* <Route 
        path="/admin" 
        element={
          isAuthenticated && user?.role === 'admin' ? 
            <AdminPanel /> : 
            <Navigate to="/" />
        } 
      /> */}
    </Routes>
  </>
  )
}

export default App;