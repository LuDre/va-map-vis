import React, { useCallback, useState } from "react";
import { Map } from "react-map-gl";
import DeckGL from "@deck.gl/react";

import { MAX_YEAR } from "../consts";
import {
  useColLifeExpAllLayer,
  useColLifeExpMaleLayer,
  useColLifeExpFemaleLayer,
  useDataset,
  useGeojsonLayer,
  useTextLifeExpAllLayer,
  useTextLifeExpGenderLayer,
  useMapViewState,
} from "../hooks";
import {
  getGdp,
  getGdpPerCapita,
  getImmunRateDpt,
  getLifeExpAll,
  getLifeExpFemale,
  getLifeExpMale,
  getGdpChartData,
  getImmunDptSim,
} from "../utils";

import InfoPopup from "../InfoPopup/InfoPopup";
import MapLegend from "../MapLegend/MapLegend";

import "./WorldMap.scss";

const MAPBOX_TOKEN = "pk.eyJ1IjoieWFyeWNrYSIsImEiOiJjazd0ZzAyYXYweGFtM2dxdHBxN2RxbnJmIn0.e0TnDHhdtb5qz3pfPbAgmw"; // Set your mapbox token here
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

const COLOR_INDICATORS = {
  GDP: { label: "GDP", getter: getGdp, chartDataGetter: getGdpChartData },
  GDP_PER_CAPITA: { label: "GDP per capita", getter: getGdpPerCapita, chartDataGetter: getGdpChartData },
  IMMUNIZATION: { label: "Immunization", getter: getImmunRateDpt, chartDataGetter: getGdpChartData },
};

// DeckGL react component
function WorldMap() {
  const [year, setYear] = useState(MAX_YEAR);
  const [data] = useDataset();
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [colorIndicator, setColorIndicator] = useState(COLOR_INDICATORS.GDP_PER_CAPITA);

  const onToggleCountry = useCallback(
    (country) => {
      const filteredCountries = selectedCountries.filter(
        (element) => element?.object?.properties?.ADMIN !== country?.object?.properties?.ADMIN
      );
      const isAlreadySelected = filteredCountries.length !== selectedCountries.length;
      if (isAlreadySelected) {
        setSelectedCountries(filteredCountries);
      } else {
        setSelectedCountries([...filteredCountries, country]);
      }
    },
    [selectedCountries]
  );

  const onSwitchMetric = useCallback(
    () => {
      if(colorIndicator === COLOR_INDICATORS.IMMUNIZATION){
        setColorIndicator(COLOR_INDICATORS.GDP_PER_CAPITA);
      }else{
        setColorIndicator(COLOR_INDICATORS.IMMUNIZATION);
      }
    },
    [colorIndicator]
  );

  const onDeselectCountries = useCallback(() => {
    setSelectedCountries([]);
  }, [setSelectedCountries]);

  const textLifeExpAll = useTextLifeExpAllLayer(data, year);
  const textLifeExpGender = useTextLifeExpGenderLayer(data, year, "textLifeExpGender", 1.2, 10);
  const textLifeExpGenderClose = useTextLifeExpGenderLayer(data, year, "textLifeExpGenderClose", 0.5, 12);

  const [geoJsonImmuLayer, colorScaleImmu] = useGeojsonLayer(data, year, "immuGround", onToggleCountry, selectedCountries, getImmunRateDpt);
  const [geoJsonGDPLayer, colorScaleGdp] = useGeojsonLayer(data, year, "gdpGround", onToggleCountry, selectedCountries, getGdpPerCapita);
  const colLifeExpAll = useColLifeExpAllLayer(data, year);
  const colLifeExpMale = useColLifeExpMaleLayer(data, year, "colLifeExpMale", 15000, 0.5, -0.5);
  const colLifeExpFemale = useColLifeExpFemaleLayer(data, year, "colLifeExpFemale", 15000, 0.5, 0.5);

  const { initViewState, onViewStateChange } = useMapViewState();

  const displayTooltip = (info) => {
    if (!info || !info.object) return undefined;

    if (info.layer?.id === "colLifeExpFemale") return `Female: ${Math.round(getLifeExpFemale(year)(info.object))}years`;
    if (info.layer?.id === "colLifeExpMale") return `Male: ${Math.round(getLifeExpMale(year)(info.object))}years`;
    if (info.layer?.id === "colLifeExpAll") return `Avg: ${Math.round(getLifeExpAll(year)(info.object))}years`;
  };

  const filterLayers = ({ layer, viewport }) => {
    if (layer.id === "immuGround") return colorIndicator === COLOR_INDICATORS.IMMUNIZATION;
    if (layer.id === "gdpGround") return colorIndicator === COLOR_INDICATORS.GDP_PER_CAPITA;
    if (layer.id === "textLifeExpAll") return viewport.zoom > 3 && viewport.zoom <= 4;
    if (layer.id === "textLifeExpGender") return viewport.zoom > 4;

    if (layer.id === "colLifeExpAll") return viewport.zoom < 4;

    if (layer.id === "colLifeExpMale") return viewport.zoom > 4;

    if (layer.id === "colLifeExpFemale") return viewport.zoom > 4;
    return true;
  };

  const layers = [
    geoJsonImmuLayer,
    geoJsonGDPLayer,
    textLifeExpAll,
    textLifeExpGender,
    colLifeExpAll,
    colLifeExpMale,
    colLifeExpFemale,
  ].filter((l) => l);

  if (!geoJsonGDPLayer || !data?.features) return <div className="WorldMap__loader">Loading...</div>;

  return (
    <div>
      <DeckGL
        layers={layers}
        layerFilter={filterLayers}
        initialViewState={initViewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        getTooltip={displayTooltip}
      >
        <Map reuseMaps preventStyleDiffing={true} mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      </DeckGL>
      {selectedCountries?.length ? (
        <InfoPopup
          country={selectedCountries?.[0]}
          countries={selectedCountries}
          year={year}
          onClose={onDeselectCountries}
          firstChartLabel={"Life expectancy"}
          secondChartLabel={colorIndicator?.label}
        />
      ) : null}
      <MapLegend scale={colorIndicator === COLOR_INDICATORS.GDP_PER_CAPITA ? colorScaleGdp : colorScaleImmu} label={colorIndicator?.label} onSwitchMetric={onSwitchMetric}  />
    </div>
  );
}

export default WorldMap;
