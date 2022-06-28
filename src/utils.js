import { useCallback, useMemo, useState } from "react";
import { scaleBand, scaleLinear } from "@visx/scale";

import { reverse } from "lodash";

import { MIN_YEAR, ChartVariant, AxisVariant, MAX_YEAR } from "./consts";

// Return year index
const getYearIdx = (year) => {
  return year - MIN_YEAR;
};

// LIFEEXPALL
export const getLifeExpAll = (displayedYear) => (d) => {
  const { lifeExpAll } = d.properties;
  if (!lifeExpAll) return [255, 255, 255];
  return lifeExpAll?.[getYearIdx(displayedYear)];
};

// LIFEEXPFEMALE
export const getLifeExpFemale = (displayedYear) => (d) => {
  const { lifeExpFemale } = d.properties;
  if (!lifeExpFemale) return [255, 255, 255];
  return lifeExpFemale?.[getYearIdx(displayedYear)];
};

// LIFEEXPMALE
export const getLifeExpMale = (displayedYear) => (d) => {
  const { lifeExpMale } = d?.properties;
  if (!lifeExpMale) return [255, 255, 255];
  return lifeExpMale?.[getYearIdx(displayedYear)];
};

// IMMUNDPT
export const getImmunRateDpt = (displayedYear) => (d) => {
  const { immunDpt } = d.properties;
  if (!immunDpt) return [255, 255, 255];
  return immunDpt?.[getYearIdx(displayedYear)];
};

// GDP
export const getGdp = (displayedYear) => (d) => {
  const { gdp } = d.properties;
  if (!gdp) return [255, 255, 255];
  return gdp?.[getYearIdx(displayedYear)];
};

// GDP per Capita
export const getGdpPerCapita = (displayedYear) => (d) => {
  const { gdpPerCapita } = d.properties;
  if (!gdpPerCapita) return [255, 255, 255];
  return gdpPerCapita?.[getYearIdx(displayedYear)];
};

// LifeExpAll prediction for in 10 years
export const getLifeExpPred = (d) => {
  const { lifeExpPred } = d.properties;
  if (!lifeExpPred) return -1;
  return lifeExpPred;
};

// LifeExpFemale prediction for in 10 years
export const getLifeExpFemalePred = (d) => {
  const { lifeExpFemalePred } = d.properties;
  if (!lifeExpFemalePred) return -1;
  return lifeExpFemalePred;
};

// LifeExpMale prediction for in 10 years
export const getLifeExpMalePred = (d) => {
  const { lifeExpMalePred } = d.properties;
  if (!lifeExpMalePred) return -1;
  return lifeExpMalePred;
};

// GDP per Capita prediction for in 10 years
export const getGdpPerCapitaPred = (d) => {
  const { gdpPred } = d.properties;
  if (!gdpPred) return -1;
  return gdpPred;
};

// Spearman correlation between lifeExpAll and GdpPerCapita
export const getLifeExpGdpCorrS = (d) => {
  const { lifeExpGdpCorrS } = d.properties;
  if (!lifeExpGdpCorrS) return -1;
  return lifeExpGdpCorrS.toFixed(2);
};

// Pearson correlation between lifeExpAll and GdpPerCapita
export const getLifeExpGdpCorrP = (d) => {
  const { lifeExpGdpCorrP } = d.properties;
  if (!lifeExpGdpCorrP) return -1;
  return lifeExpGdpCorrP.toFixed(2);
};

// Spearman correlation between lifeExpAll and Immunization
export const getLifeExpImmunCorrS = (d) => {
  const { lifeExpImmunCorrS } = d.properties;
  if (!lifeExpImmunCorrS) return -1;
  return lifeExpImmunCorrS.toFixed(2);
};

// Pearson correlation between lifeExpAll and Immunization
export const getLifeExpImmunCorrP = (d) => {
  const { lifeExpImmunCorrP } = d.properties;
  if (!lifeExpImmunCorrP) return -1;
  return lifeExpImmunCorrP.toFixed(2);
};

// LifeExpAll similiarty value in comparison with other countries --> index = countrycode
export const getLifeExpSim = (otherCountryCode) => (d) => {
  const { lifeExpSim } = d.properties;
  if (!lifeExpSim) return -1;
  return lifeExpSim?.[otherCountryCode];
};

// ImmunDpt similiarty value in comparison with other countries --> index = countrycode
export const getImmunDptSim = (otherCountryCode) => (d) => {
  const { immunDptSim } = d.properties;
  if (!immunDptSim) return -1;
  return immunDptSim?.[otherCountryCode];
};

// GDP per Capita similiarty value in comparison with other countries --> index = countrycode
export const getGdpSim = (otherCountryCode) => (d) => {
  const { gdpSim } = d.properties;
  if (!gdpSim) return -1;
  return gdpSim?.[otherCountryCode];
};

export const getMostSimGdp = (d) => {
  const { gdpSim } = d.properties;
  if (!gdpSim) return -1;

  var tempItems = Object.keys(gdpSim).map(function (key) {
    return [key, gdpSim[key]];
  });

  tempItems.sort(function (first, second) {
    return second[1] - first[1];
  });

  return tempItems
    .slice(1, 6)
    .map((x) => {
      return x[0];
    })
    .join(", ");
};

export const getMostSimLifeExp = (d) => {
  const { lifeExpSim } = d.properties;
  if (!lifeExpSim) return -1;

  var tempItems = Object.keys(lifeExpSim).map(function (key) {
    return [key, lifeExpSim[key]];
  });

  tempItems.sort(function (first, second) {
    return second[1] - first[1];
  });

  return tempItems
    .slice(1, 6)
    .map((x) => {
      return x[0];
    })
    .join(", ");
};

export const getMostSimImmunDpt = (d) => {
  const { immunDptSim } = d.properties;
  if (!immunDptSim) return -1;

  var tempItems = Object.keys(immunDptSim).map(function (key) {
    return [key, immunDptSim[key]];
  });

  tempItems.sort(function (first, second) {
    return second[1] - first[1];
  });

  return tempItems
    .slice(1, 6)
    .map((x) => {
      return x[0];
    })
    .join(", ");
};

export const getLinearScale = (values = [], range) =>
  scaleLinear({
    domain: [Math.min(...values), Math.max(...values)],
    range,
  });

export const getBandScale = (domain = [], range, padding = 0) =>
  scaleBand({
    domain,
    range,
    round: true,
    padding,
  });

export const formatAxisTick = (handler) => (text) => handler ? handler(text) : text;

export const getAxisTickLabelProps =
  (variant = AxisVariant.bottom) =>
  () => {
    let textAnchor = "middle";
    if (variant === AxisVariant.left) textAnchor = "end";
    if (variant === AxisVariant.right) textAnchor = "start";
    return {
      fill: Text.Default,
      fontSize: "0.75rem",
      dy: variant === AxisVariant.bottom ? 0 : "0.33em",
      textAnchor,
    };
  };

export const getMaleFemaleChartData = (countries = []) => {
  if (countries.length === 1) {
    const countryProps = countries[0]?.object?.properties;
    const maleData = {
      id: "male",
      label: "Male",
      color: "blue",
      datapoints: countryProps?.lifeExpMale
        ?.map((yearData, index) => {
          return {
            valueY: yearData,
            valueX: MIN_YEAR + index,
            text: `Men in ${MIN_YEAR + index}\n${yearData} years`,
          };
        })
        .filter((d) => d.valueX <= MAX_YEAR && d.valueX >= MIN_YEAR),
    };
    const femaleData = {
      id: "female",
      label: "Female",
      color: "pink",
      datapoints: countryProps?.lifeExpFemale
        ?.map((yearData, index) => {
          return {
            valueY: yearData,
            valueX: MIN_YEAR + index,
            text: `Women in ${MIN_YEAR + index}\n${yearData} years`,
          };
        })
        .filter((d) => d.valueX <= MAX_YEAR && d.valueX >= MIN_YEAR),
    };
    return [maleData, femaleData];
  }
  return countries.map((country) => {
    const countryProps = country?.object?.properties;

    return {
      id: "lifeExpAll",
      label: `LifeExpectancy-${countryProps.ADMIN}`,
      color: countryProps?.chartColor,
      datapoints: countryProps?.lifeExpAll
        ?.map((yearData, index) => {
          return {
            valueY: yearData,
            valueX: MIN_YEAR + index,
            text: `${countryProps.ADMIN} in ${MIN_YEAR + index}\n${yearData} years`,
          };
        })
        .filter((d) => d.valueX <= MAX_YEAR && d.valueX >= MIN_YEAR),
    };
  });
};

export const getGdpChartData = (countries = []) => {
  return countries.map((country) => {
    const countryProps = country?.object?.properties;
    const data = {
      id: `GDP-${countryProps.ADMIN}`,
      label: `GDP-${countryProps.ADMIN}`,
      color: countryProps?.chartColor,
      datapoints: countryProps?.gdpPerCapita
        ?.map((yearData, index) => {
          return {
            valueY: yearData,
            valueX: MIN_YEAR + index,
            text: `${countryProps.ADMIN} in ${MIN_YEAR + index}\nGDP ${yearData}`,
          };
        })
        .filter((d) => d.valueX <= MAX_YEAR && d.valueX >= MIN_YEAR),
    };
    return data;
  });
};

export const getImmuChartData = (countries = []) => {
  return countries.map((country) => {
    const countryProps = country?.object?.properties;
    const data = {
      id: `IM-${countryProps.ADMIN}`,
      label: `IMMU-${countryProps.ADMIN}`,
      color: countryProps?.chartColor,
      datapoints: countryProps?.immunDpt
        ?.map((yearData, index) => {
          return {
            valueY: yearData,
            valueX: MIN_YEAR + index,
            text: `${countryProps.ADMIN} in ${MIN_YEAR + index}\nImmunization ${yearData}`,
          };
        })
        .filter((d) => d.valueX <= MAX_YEAR && d.valueX >= MIN_YEAR),
    };
    return data;
  });
};
// here
export const getClosestCoordinate = (scale, point) => {
  const scaleValue = Math.round(scale.invert(point));
  const valueCoordinate = scale(scaleValue);
  const bandMidCoordinate = valueCoordinate ? valueCoordinate : 0;
  return [scaleValue, bandMidCoordinate];
};
