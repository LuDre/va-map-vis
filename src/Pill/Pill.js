import React from "react";
import "./Pill.scss";

export const PillVariant = {
  male: "male",
  female: "female",
  negTrend: "negTrend",
  posTrend: "posTrend",
  custom: "custom",
};

// Variant: male / female
const Pill = ({ children, variant, style = {} }) => {
  return (
    <div className={`Pill Pill--${variant}`} style={style}>
      {children}
    </div>
  );
};

export default Pill;
