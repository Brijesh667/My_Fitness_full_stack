import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './axiosClient';

// Fetch Week Workout (user identified via cookie token)
export const getWeekWorkout = createAsyncThunk(
    'week/data',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get('/week/find', {
                withCredentials: true, // important for cookies
            });
            return response.data; // backend should send proper data
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { message: 'Something went wrong' }
            );
        }
    }
);

const workoutSlice = createSlice({
    name: 'workout',
    initialState: {
        data: null,
        loading: false,
        error: null,
    },

    reducers: {
        resetWorkout: (state) => {
            state.data = null;
            state.loading = false;
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(getWeekWorkout.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getWeekWorkout.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })

            .addCase(getWeekWorkout.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload?.message || 'Something went wrong';
                state.data = null;
            });
    },
});

export const { resetWorkout } = workoutSlice.actions;

export default workoutSlice.reducer;