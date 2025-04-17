import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {
  const [itemsToShow, setItemsToShow] = useState(4);
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = [
    //{ value: "TopSellers", label: "Top Sellers" },
    { value: "Diabetes", label: "Diabetes" },
    { value: "Heart-Care", label: "Heart Care" },
    { value: "Liver-Care", label: "Liver Care" },
    { value: "Digestive-Care", label: "Digestive Care" },
    { value: "Skin-Care", label: "Skin Care" },
    { value: "vitamins-and-minerals", label: "Vitamins & Minerals" },
    { value: "Neurological-and-Psychiatric", label: "Neurology & Psychiatry" },
    { value: "Reproductive-Health-Wellness", label: "Reproductive Health" },
  ];

  // Responsive item display
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setItemsToShow(3);
      } else if (width < 768) {
        setItemsToShow(4);
      } else {
        setItemsToShow(5);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update scroll buttons visibility
  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;
      setCanScrollLeft(containerRef.current.scrollLeft > 0);
      setCanScrollRight(
        containerRef.current.scrollLeft <
          containerRef.current.scrollWidth - containerRef.current.clientWidth
      );
    };
    checkScroll();
    if (containerRef.current) {
      containerRef.current.addEventListener("scroll", checkScroll);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  // Handle arrow navigation
  const handleScroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth / itemsToShow;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex justify-center ml-[-8px] sm:ml-[-24px] items-center w-full pt-1 pb-1 sm:px-8 sm:pb-2">
      <div className="w-full max-w-3xl sm:max-w-6xl mx-auto">
        <div className="relative flex items-center bg-[#f0f8ff] p-2 sm:p-3 md:p-4 rounded-xl shadow-md">
          {/* Left Arrow */}
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md transition-all duration-200 ${
              canScrollLeft
                ? "hover:bg-gray-100 text-gray-700"
                : "opacity-50 cursor-not-allowed text-gray-400"
            }`}
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Category Container */}
          <div
            className="flex overflow-x-auto w-full mx-2 gap-4 scroll-smooth scrollbar-hide"
            ref={containerRef}
          >
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.value
                    ? "bg-[#d7548c] text-white shadow-md"
                    : "bg-white text-gray-700 shadow-md sm:hover:bg-[#75c6eb]"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md transition-all duration-200 ${
              canScrollRight
                ? "hover:bg-gray-100 text-gray-700"
                : "opacity-50 cursor-not-allowed text-gray-400"
            }`}
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Next categories"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
