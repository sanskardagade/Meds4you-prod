import { Search } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  setSearchQuery,
  setLoading,
} from "../redux/slice/searchSlice";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localSearchResults, setLocalSearchResults] = useState([]);
  const [loading, setLoadingState] = useState(false); 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    if (localSearchQuery.trim()) {
      setIsTyping(true);
      const delayDebounceFn = setTimeout(() => {
        fetchSearchResults();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setLocalSearchResults([]);
      setIsTyping(false);
    }
  }, [localSearchQuery]);

  const fetchSearchResults = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/products/search?q=${localSearchQuery}`
      );
      setLocalSearchResults(response.data); 
    } catch (error) {
      console.error("Search error:", error.response?.data || error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const showSearchResults = localSearchResults.length > 0;

  return (
    <div className="flex justify-center items-center w-full">
      <div className="flex-grow max-w-3xl mr-2 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (localSearchQuery.trim()) {
              // Only dispatch the global search query when the user submits the form
              dispatch(setSearchQuery(localSearchQuery));
              fetchSearchResults();
            }
          }}
          className="flex items-center relative w-full"
        >
          <div id="main-search-bar" className="relative w-full mx-auto mt-20">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search your Medicines"
              value={localSearchQuery} // Bind the local search query state to the input
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full px-12 py-1 sm:py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out placeholder:text-xs sm:placeholder:text-base"
            />
          </div>

          {localSearchQuery && (
            <button
              type="button"
              onClick={() => setLocalSearchQuery("")}
              className="absolute pt-20 right-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl"
            >
              ×
            </button>
          )}
        </form>

        {showSearchResults && (
          <div className="absolute top-full left-0 w-full sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[200px] lg:min-w-[750px] z-50 mx-auto mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl transition-all ease-in-out duration-300 max-h-[50vh] sm:max-h-[35vh] overflow-hidden">
            <div className="sticky top-0 bg-gray-50 px-1 sm:px-2 py-1 sm:py-1.5 border-b border-gray-100 z-10">
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
              {localSearchResults.length}{" "}
              {localSearchResults.length === 1 ? "result" : "results"} found
              </p>
            </div>

            <div className="overflow-y-auto max-h-[20vh] sm:max-h-[30vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-hide">
              {localSearchResults.map((result) => (
                <div
                  key={result._id}
                  className="group transition-all duration-200 ease-in-out hover:bg-blue-50/50"
                  onClick={() => {
                    setLocalSearchResults([]);  // Clear local search results on click
                    setLocalSearchQuery(""); 
                    navigate(`/medicine/${result._id}`);
                  }}
                >
                  <div className="px-1 sm:px-3 py-1 sm:py-2 border-b border-gray-200 last:border-0 flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[9px] sm:text-xs font-semibold text-gray-900 truncate">
                        {result.drugName}
                      </h4>
                      <div className="flex items-center gap-1 text-[9px] sm:text-xs text-gray-500">
                        <span className="text-[9px] sm:text-xs text-gray-500">
                          {" "}
                          {result.size}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] sm:text-sm text-gray-800 font-medium">
                      ₹{result.price} {/* Adjust based on your price format */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent py-1 mt-3 sm:py-1.5">
              <div className="text-center text-[8px] sm:text-[9px] text-gray-500">
                Click any result to view details
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute top-full left-0 mt-2 w-[90%] text-center text-sm text-gray-500">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
