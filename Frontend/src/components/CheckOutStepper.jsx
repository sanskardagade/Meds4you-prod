import { Stepper, Step, StepLabel } from "@mui/material";
import { useLocation } from "react-router-dom";

const steps = ["Cart", "Checkout with Prescription", "Payment", "Delivery"];

const getStep = (pathname) => {
  switch (pathname) {
    case "/cart":
      return 0;
    case "/checkout":
      return 1;
    case "/payment":
      return 2;
    case "/delivery":
      return 3;
    default:
      return 0;
  }
};

const CheckoutStepper = () => {
  const location = useLocation();
  const activeStep = getStep(location.pathname);

  return (
    <div className="stepper-container bg-gray-50 pt-28 mb-[-70px] px-4 md:px-8">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepIcon-root": {
                  color: index < activeStep ? "#d84c89" : (index === activeStep ? "#d84c89" : "gray"),
                  transition: "color 0.3s ease, transform 0.3s ease", 
                  fontSize: "1.5rem", // Mobile icon size
                  "&.Mui-active": {
                    color: "#d84c89", // Ensure active step is in pink
                  },
                  "&.Mui-completed": {
                    color: "#d84c89", // Ensure completed steps are in pink
                  }
                },
                "& .MuiStepLabel-label": {
                  fontWeight: 600,
                  fontSize: "0.9rem", // Mobile text size
                  color: index <= activeStep ? "#d84c89" : "gray",
                  transition: "color 0.3s ease, font-weight 0.3s ease",
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
};

export default CheckoutStepper;
