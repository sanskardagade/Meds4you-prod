import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const MedicineCarousel = ({ products, addToCart, isLoading }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
const token = useSelector((state) => state.auth.token); // Add this line to get token
  const [selectedVariant, setSelectedVariant] = useState({});
  const [swiperInstance, setSwiperInstance] = useState(null);
  const isDesktop = window.innerWidth >= 1024;

  const handleAddToCart = async (productId, variantIndex) => {
    if (!isAuthenticated || !token) {
      toast.error("Please login to add items to cart", {
        position: "top-center",
        autoClose: 3000,
        });
      return;
    }

    try {
await addToCart(productId);
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Failed to add to cart", {
        position: "top-center",
      });
    }
  };

  const handleNext = () => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  };

  const handlePrev = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 text-lg py-10">
          No medicines available
        </div>
      ) : (
        <div className="relative pl-4 py-4 mx-auto max-w-[1500px] my-24">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              el: ".swiper-pagination",
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            spaceBetween={20}
            loop={true}
            grabCursor={true}
            preventClicks={false}
            preventClicksPropagation={false}
            touchStartPreventDefault={false}
            touchMoveStopPropagation={true}
            touchReleaseOnEdges={true}
            resistance={false}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            className="pb-6"
            breakpoints={{
              0: { slidesPerView: 1, spaceBetween: 10 },
              320: { slidesPerView: 1, spaceBetween: 10 },
              768: { slidesPerView: 1, spaceBetween: 20 },
              1024: { slidesPerView: 2, spaceBetween: 20 },
              1200: { slidesPerView: 3, spaceBetween: 20 },
            }}
          >
            {products.map((product) => (
              <SwiperSlide
                key={product._id}
                className="flex justify-center"
                onMouseEnter={() =>
                  isDesktop && swiperInstance?.autoplay.stop()
                }
                onMouseLeave={() =>
                  isDesktop && swiperInstance?.autoplay.start()
                }
              >
                <div className="flex justify-center pr-4 mb-1 items-center mx-auto w-full">
                  <div className="flex flex-col h-[480px] sm:h-[460px] w-[320px] sm:w-[340px] rounded-lg sm:shadow-[0_2px_1px_rgba(20,7,76,0.15),_1px_4px_20px_rgba(230,64,64,0.1),_0_4px_25px_rgba(236,40,59,0.1)] sm:hover:shadow-[0_5px_20px_rgba(228,76,76,0.2),_1px_5px_2px_rgba(230,64,64,0.15),_0_6px_30px_rgba(236,40,59,0.15)] transition-shadow duration-300 overflow-hidden bg-white">
                    {/* Header */}
                    <div className="bg-[#d9327a] text-white text-center py-1 px-2 font-medium text-base rounded-t-lg">
                      {product.salt}
                    </div>

                    {/* Main content */}
                    <div className="flex h-full w-full">
                      {/* Left side - Regular */}
                      <div>{/*console.log("products", products)*/}</div> 
                      <div className="w-1/2 bg-[rgb(242,249,253)] flex flex-col justify-between p-4">
                        <div>
                          <p className="font-bold px-4">Branded</p>
                          <img
                            src={product.imageUrl || "./default-image.jpg"}
                            alt="Tablet 1"
                            className="h-39 w-[90px] mb-4"
                          />
                          <div className="space-y-2">
                            <p className="font-bold text-sm">{product.drugName}</p>
                            <p className="text-sm leading-tight">
                              {product.manufacturer}
                            </p>
                            <p className="text-sm leading-tight">
                              {product.size}
                            </p>
                            <div className="text-gray-500 text-sm">
                              MRP: ₹
                              <span className="line-through text-sm">
                                {product.mrp}
                              </span>
                            </div>
                            <div className="text-sm">
                              Price:{" "}
                              <span className="text-lg">₹{product.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Recommended */}
                      <div className="w-1/2 bg-[rgb(246,255,243)] rounded-br-lg flex flex-col h-full overflow-hidden">
                        <p className="font-bold px-5 pt-3">Generic</p>
                        <div className="flex-1 overflow-y-auto px-4 pb-2">
                          {product.alternateMedicines?.map((alt, index) => (
                            <div
                              key={index}
                              onClick={() =>
                                setSelectedVariant({
                                  ...selectedVariant,
                                  [product._id]: index,
                                })
                              }
                              className="flex flex-col items-left mb-2 space-y-2 cursor-pointer"
                            >
                              <img
                                src={alt.manufacturerUrl || "./default-image.jpg"}
                                alt="Tablet"
                                className="h-39 w-[90px] mb-4"
                              />
                              <p className="font-bold text-sm text-left ">
                                {alt.name}
                              </p>
                              <p className="text-left text-sm mt-1">
                                {alt.manufacturer || "Mfg Name:NA"}
                              </p>
                              <p className="text-left text-sm mt-1">
                                {alt.size_1}
                              </p>
                              <div className="text-left text-gray-500 text-sm">
                                MRP: ₹
                                <span className="line-through text-sm ">{alt.mrp}</span>
                              </div>
                              <div className="text-left font-bold text-green-600 text-sm">
                                Price:{" "}
                                <span className="text-xl">₹{alt.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center">
                    <button
                      className="bg-[#419ec8] m-1 hover:bg-[#2f548c] text-white px-2 py-2 rounded-lg min-w-52 text-sm opacity-60 transition duration-300"
                      onClick={() =>
                        handleAddToCart(
                          product._id,
                          selectedVariant[product._id]
                        )
                      }
                    >
                      Add to Cart
                    </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* <div className="swiper-pagination mt-2 flex justify-center">...</div> */}

          {products.length > 0 && (
            <>
              <button
                className="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 justify-center items-center w-12 h-12 bg-gray-200 text-gray-800 rounded-full shadow-lg cursor-pointer z-10 md:left-4 lg:left-8"
                onClick={handlePrev}
                style={{ marginLeft: "-50px" }}
              >
                <span className="text-2xl">&#10094;</span>
              </button>
              <button
                className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 justify-center items-center w-12 h-12 bg-gray-200 text-gray-800 rounded-full shadow-lg cursor-pointer z-10 md:right-4 lg:right-8"
                onClick={handleNext}
                style={{ marginRight: "-50px" }}
              >
                <span className="text-2xl">&#10095;</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default MedicineCarousel;
