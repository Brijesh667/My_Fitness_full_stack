import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './axiosClient'

export const registerUser = createAsyncThunk(
    'auth/register',
    async(userData, {rejectWithValue})=>{
        try{
            const response = await axiosClient.post('user/register',userData);
            return response.data.user;
        }
        catch(error){
            return rejectWithValue(error);
        }
    }
);

/*

because we returning 
res.status(200).json(
    {
        user:type,
        message:'data return successfully...'
    }
)

jab yeh retuqest marega then yeh resposne mai aa jayega, {user:type,message:'data return successfully...}

const resposne = {
data:{user:type,message:'data return successfully...},
status_code:200,
.... like this kai sare field honge response ke andar, 
so is liye ham return kra rhe hai, 
response.data.user
then hamne jo type object bna ke user ka detail return kiya tha wahi details yeh return karega,

}
*/

export const loginUser = createAsyncThunk(
    'auth/login',
    async(Credentials, {rejectWithValue})=>{
        try{
            const response = await axiosClient.post('/user/login',Credentials);
            return response.data.user;

        }

        catch(error){
            return rejectWithValue(error)
        }
    }
)

export const checkAuth = createAsyncThunk(
    'auth/check',
    async({rejectWithValue})=>{
        try{
            const response = await axiosClient.get('/user/authcheck');
            return response.data.user;

        }
        catch(error){
            return rejectWithValue(error)
        }
    }
)
export const logoutUser = createAsyncThunk(
    'auth/logout',
    async({rejectWithValue})=>{
        try{
            const response = await axiosClient.post('/user/logout');
            return response.data.user;

        }
        catch(error){
            return rejectWithValue(error)
        }
    }
)


const authSlice = createSlice({
    name:'auth',
    initialState:{
        user:null,
        isAuthenticated:false,
        loading:false,
        error:null
    },

    reducers:{},

  extraReducers: (builder) => {
        builder
        //Register User
        .addCase(registerUser.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })

        .addCase(registerUser.fulfilled,(state,action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;
            state.user = action.payload;
        })

        .addCase(registerUser.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong'
            state.user = null;
            state.isAuthenticated = false;
        })

        //Login User Cases
        .addCase(loginUser.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })

        .addCase(loginUser.fulfilled,(state,action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;
            state.user = action.payload;
        })

        .addCase(loginUser.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong'
            state.user = null;
            state.isAuthenticated = false;
        })

        //Check Auth Cases
      .addCase(checkAuth.pending,(state)=>{
            state.loading = true;
            state.error = null;
        })

        .addCase(checkAuth.fulfilled,(state,action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;
            state.user = action.payload;
        })

        .addCase(checkAuth.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong'
            state.user = null;
            state.isAuthenticated = false;
        })


        //logout

        .addCase(logoutUser.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })

        .addCase(logoutUser.fulfilled, (state,action)=>{
            state.loading = false;
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        })
        .addCase(logoutUser.rejected, (state,action)=>{
            state.loading = false;
            state.error = action.payload?.message || 'something went wrong'
            state.isAuthenticated = false;
            state.user = null;
        });


    }
});

export default authSlice.reducer;