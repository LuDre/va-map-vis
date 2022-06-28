import React from "react";
import tinycolor from "tinycolor2";

import {
  getGdpPerCapita,
  getGdpPerCapitaPred,
  getLifeExpAll,
  getLifeExpFemale,
  getLifeExpMale,
  getLifeExpPred,
  getLifeExpFemalePred,
  getLifeExpMalePred,
  getMostSimGdp,
  getMostSimLifeExp,
  getMaleFemaleChartData,
  getGdpChartData,
  getImmuChartData,
  getLifeExpGdpCorrS,
  getLifeExpGdpCorrP,
  getLifeExpImmunCorrS,
  getLifeExpImmunCorrP,
  getMostSimImmunDpt,
} from "../utils";

import { useCountriesWithColors } from "../hooks";

import LineChart from "../LineChart";
import Pill, { PillVariant } from "../Pill";
import { MAX_YEAR } from "../consts";

import "./InfoPopup.scss";

const formatXScale = Math.round;
const formatYScale = (d) => {
  const MILLION = 1000 * 1000;
  const BILLION = 1000 * MILLION;
  const TRILLION = 1000 * BILLION;

  if (d >= TRILLION) {
    return `${Math.round(d / TRILLION)}T`;
  }
  if (d >= BILLION) {
    return `${Math.round(d / BILLION)}B`;
  }
  if (d >= MILLION) {
    // one million
    return `${Math.round(d / MILLION)}MM`;
  }
  if (d >= 1000) {
    return `${Math.round(d / 1000)}K`;
  }
  return Math.round(d);
};

const InfoPopup = ({ year, country, countries, onClose, firstChartLabel, secondChartLabel }) => {
  const name = countries.length === 1 ? country?.object?.properties?.ADMIN || "" : "";
  const maleLifeExpectancy = getLifeExpMale(year)(country.object);
  const femaleLifeExpectancy = getLifeExpFemale(year)(country.object);
  const lifeExpAll = getLifeExpAll(MAX_YEAR)(country.object);
  const lifeExpPred = getLifeExpPred(country.object);
  const lifeExpFemalePred = getLifeExpFemalePred(country.object);
  const lifeExpMalePred = getLifeExpMalePred(country.object);
  const mostSimLifeExp = getMostSimLifeExp(country.object);
  const gdpPerCapita = getGdpPerCapita(MAX_YEAR)(country.object);
  const gdpPred = getGdpPerCapitaPred(country.object);
  const mostSimGdp = getMostSimGdp(country.object);
  const mostSimImmunDpt = getMostSimImmunDpt(country.object);
  const lifeExpGdpCorrS = getLifeExpGdpCorrS(country.object);
  const lifeExpGdpCorrP = getLifeExpGdpCorrP(country.object);
  const lifeExpImmuCorrS = getLifeExpImmunCorrS(country.object);
  const lifeExpImmuCorrP = getLifeExpImmunCorrP(country.object);

  const countriesWithColors = useCountriesWithColors(countries);

  const firstChartData = countriesWithColors?.length ? getMaleFemaleChartData(countriesWithColors) : [];
  const secondChartData = countriesWithColors?.length
    ? secondChartLabel !== "Immunization"
      ? getGdpChartData(countriesWithColors)
      : getImmuChartData(countriesWithColors)
    : [];

  return (
    <div className="InfoPopup">
      <h2 className="InfoPopup__header">{name}</h2>
      <button className="InfoPopup__close" onClick={onClose}>
        &#10005;
      </button>
      <LineChart
        heading={firstChartLabel}
        data={firstChartData}
        numXAxisTicks={5}
        numYAxisTicks={5}
        formatXScale={formatXScale}
        formatYScale={formatYScale}
        height={250}
        padding={{ top: 30, bottom: 0, left: 40, right: 15 }}
      />
      {countries?.length <= 1 && (
        <div className="InfoPopup__pills">
          <Pill variant={PillVariant.male}>Men {maleLifeExpectancy} years</Pill>
          <Pill variant={PillVariant.female}>Women {femaleLifeExpectancy} years</Pill>
        </div>
      )}
      {countries?.length <= 1 && secondChartLabel !== "Immunization" && (
        <div className="InfoPopup__pills">
          {lifeExpGdpCorrS >= 0.8 && (
            <Pill variant={PillVariant.posTrend}>
              High Correlation: P ({lifeExpGdpCorrP}) Sp ({lifeExpGdpCorrS})
            </Pill>
          )}
          {lifeExpGdpCorrS < 0.8 && lifeExpGdpCorrS > 0.5 && (
            <Pill variant={PillVariant.custom}>
              Medium Correlation: P ({lifeExpGdpCorrP}) Sp {lifeExpGdpCorrS})
            </Pill>
          )}
          {lifeExpGdpCorrS < 0.5 && (
            <Pill variant={PillVariant.negTrend}>
              Low Correlation: P ({lifeExpGdpCorrP}) Sp ({lifeExpGdpCorrS})
            </Pill>
          )}
        </div>
      )}
      {countries?.length <= 1 && secondChartLabel === "Immunization" && (
        <div className="InfoPopup__pills">
          {lifeExpImmuCorrS >= 0.8 && (
            <Pill variant={PillVariant.posTrend}>
              High Correlation: P ({lifeExpImmuCorrP}) Sp ({lifeExpImmuCorrS})
            </Pill>
          )}
          {lifeExpImmuCorrS < 0.8 && lifeExpImmuCorrS > 0.5 && (
            <Pill variant={PillVariant.custom}>
              Medium Correlation: P ({lifeExpImmuCorrP}) Sp {lifeExpImmuCorrS})
            </Pill>
          )}
          {lifeExpImmuCorrS < 0.5 && (
            <Pill variant={PillVariant.negTrend}>
              Low Correlation: P ({lifeExpImmuCorrP}) Sp ({lifeExpImmuCorrS})
            </Pill>
          )}
        </div>
      )}
      <LineChart
        heading={secondChartLabel}
        data={secondChartData}
        numXAxisTicks={5}
        numYAxisTicks={5}
        formatXScale={formatXScale}
        formatYScale={formatYScale}
        height={250}
        padding={{ top: 30, bottom: 0, left: 40, right: 15 }}
      />
      {countries?.length <= 1 ? (
        <>
          <div className="InfoPopup__other InfoPopup__other--first">
            <h3 className="InfoPopup__subheading">Future Predictions (in 2030)</h3>
            Average Life Expectancy:
            <Pill variant={PillVariant.posTrend}>{lifeExpPred} years</Pill>
            <br></br>
            Life Expectancy Female:
            <Pill variant={PillVariant.posTrend}>{lifeExpFemalePred} years</Pill>
            <br></br>
            Life Expectancy Male:
            <Pill variant={PillVariant.posTrend}>{lifeExpMalePred} years</Pill>
            <br></br>
            {secondChartLabel !== "Immunization" && (
              <div>
                GDP per Capita:
                {gdpPred >= gdpPerCapita && <Pill variant={PillVariant.posTrend}>${gdpPred}</Pill>}
                {gdpPred < gdpPerCapita && <Pill variant={PillVariant.negTrend}>${gdpPred}</Pill>}
              </div>
            )}
          </div>
          {secondChartLabel !== "Immunization" && (
            <div className="InfoPopup__other">
              <h3 className="InfoPopup__subheading">Most Similar Countries</h3>
              Average Life Expectancy: {mostSimLifeExp}
              <br></br>
              GDP per Capita: {mostSimGdp}
            </div>
          )}
          {secondChartLabel === "Immunization" && (
            <div className="InfoPopup__other">
              <h3 className="InfoPopup__subheading">Most Similar Countries</h3>
              Average Life Expectancy: {mostSimLifeExp}
              <br></br>
              Immunization DPT: {mostSimImmunDpt}
            </div>
          )}
        </>
      ) : (
        <div className="InfoPopup__pills">
          {countriesWithColors.map((country) => {
            const name = country?.object?.properties?.ADMIN;
            const chartColor = country?.object?.properties?.chartColor;
            return (
              <Pill
                variant={PillVariant.custom}
                style={{
                  background: chartColor,
                  color: tinycolor(chartColor).isDark() ? "white" : "black",
                  margin: "0.25em",
                }}
              >
                {name}
              </Pill>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InfoPopup;
