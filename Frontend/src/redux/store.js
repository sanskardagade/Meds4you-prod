// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import searchReducer from './slice/searchSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
  },
});

export default store;
