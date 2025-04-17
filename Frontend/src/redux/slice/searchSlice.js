// redux/searchSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchQuery: '',
  searchResults: [],
  loading: false,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setSearchQuery, setSearchResults, setLoading } = searchSlice.actions;

export default searchSlice.reducer;
