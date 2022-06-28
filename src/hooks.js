import { useCallback, useMemo, useState, useEffect } from "react";
import { useTooltipInPortal } from "@visx/tooltip";
import { area, point } from "@turf/turf";
import { GeoJsonLayer, TextLayer, ColumnLayer } from "@deck.gl/layers";
import { scaleSequential } from "d3-scale";
import { scaleLinear } from "@visx/scale";
import { interpolateInferno, interpolateBlues, interpolatePuRd } from "d3-scale-chromatic";
import hexRgb from "hex-rgb";
import { isNil, keyBy } from "lodash";
import { localPoint } from "@visx/event";

import {
  getLifeExpAll,
  getLifeExpFemale,
  getLifeExpMale,
  getBandScale,
  getLinearScale,
  getGdp,
  getGdpPerCapita,
  getClosestCoordinate,
  getImmunRateDpt,
} from "./utils";
import { MIN_AREA_TEXT_SHOWN, GRAY, WHITE_TRANSPARENT, lineChartColorScheme, ChartVariant } from "./consts";

// DATASET
export const useDataset = () => {
  const [data, setData] = useState();
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/countryData.geojson")
      .then((resp) => {
        return resp.json().then((res) => {
          return res.geojson;
        });
      })
      .then(setData)
      .catch((err) => console.error("Could not load data", err)); // eslint-disable-line
  }, []);

  return [data, setData];
};
const getPosition = (d) => {
  return point([d.properties.lon, d.properties.lat]).geometry.coordinates;
};

// LIFEEXPALL TEXT LAYER
export const useTextLifeExpAllLayer = (data, year) => {
  const getText = useCallback(
    (d) => {
      const lifeExpAll = getLifeExpAll(year)(d);
      if ((lifeExpAll || 0) <= 0) return "";
      const countryCode = d.properties.ISO_A3;
      const countryArea = area(d.geometry);
      return countryArea > MIN_AREA_TEXT_SHOWN ? `${countryCode} | ${Math.round(lifeExpAll)} years` : "";
    },
    [year]
  );

  const getColor = useCallback(
    (d) => {
      const avgLifeExpectancy = getLifeExpAll(year)(d);
      if (avgLifeExpectancy > 70) return [0, 0, 255, 255];
      return [0, 0, 255, 255];
    },
    [year]
  );

  const getTextPosition = useCallback((d) => {
    const position = getPosition(d);
    return [position[0], position[1] - 1.5];
  }, []);

  const layer = useMemo(
    () =>
      data?.features &&
      new TextLayer({
        id: "textLifeExpAll",
        data: data?.features,
        getPosition: getTextPosition,
        getText,
        getSize: 12,
        getAngle: 0,
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        getColor,
        background: true,
        billboard: true,
        getBackgroundColor: () => {
          return WHITE_TRANSPARENT;
        },
        fontSettings: {
          sdf: true,
          radius: 80,
          cutoff: 0.23,
        },
      }),
    [data?.features, getColor, getTextPosition]
  );
  return layer;
};

// LIFEEXPALL TEXT LAYER
export const useTextLifeExpGenderLayer = (data, year, layerId, offset, size) => {
  const getText = useCallback(
    (d) => {
      const lifeExpMale = getLifeExpMale(year)(d);
      const lifeExpFemale = getLifeExpFemale(year)(d);
      if (((lifeExpMale && lifeExpFemale) || 0) <= 0) return "";
      const country = d.properties.ADMIN;
      return `${country} \n Men ${Math.round(lifeExpMale)} y. | Women ${Math.round(lifeExpFemale)} y.`;
    },
    [year]
  );

  const getColor = useCallback(
    (d) => {
      const avgLifeExpectancy = getLifeExpAll(year)(d);
      if (avgLifeExpectancy > 70) return [0, 0, 255, 255];
      return [0, 0, 255, 255];
    },
    [year]
  );

  const getTextPosition = useCallback((d) => {
    const position = getPosition(d);
    return [position[0], position[1] - offset];
  }, []);

  const layer = useMemo(
    () =>
      data?.features &&
      new TextLayer({
        id: layerId,
        data: data?.features,
        getPosition: getTextPosition,
        getText,
        getSize: size,
        getAngle: 0,
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        getColor,
        background: true,
        billboard: true,
        getBackgroundColor: () => {
          return WHITE_TRANSPARENT;
        },
        fontSettings: {
          sdf: true,
          radius: 80,
          cutoff: 0.23,
        },
      }),
    [data?.features, getColor, getTextPosition]
  );
  return layer;
};

const formatRGB = (rgb) => rgb.match(/\d+/g).map(Number);
const getPolygon = (d) => d.geometry.coordinates;
const linColorScale = (colorScheme = ["#bfecd8", "#1A8828"], domain = [35, 90]) =>
  scaleLinear({ range: colorScheme, domain });
const seqColorScale = (colorScheme = ["#bfecd8", "#1A8828"], domain = [35, 90]) =>
  scaleSequential(colorScheme).domain(domain);

// GROUND LAYER
export const useGeojsonLayer = (data, year, layerId, onClick, selectedCountries = [], getValue) => {
  const indexedSelectedCountries = keyBy(selectedCountries, (country) => country.object?.properties?.ADMIN);
  const values = data ? data?.features?.map((d) => getValue(year)(d)).filter((d) => d !== -1) : [];
  const domain = values.length && [Math.min(...values), Math.min(75000,Math.max(...values))];

  const colorScale = domain && linColorScale(["#bfecd8", "#1A8828"], domain);

  const getFillColor = useCallback(
    (d) => {
      const value = getValue(year)(d);
      if (value === -1) return GRAY;
      const color = colorScale(value);

      if (color.startsWith("#")) {
        const { red, green, blue } = hexRgb(color);
        return [red, green, blue];
      } else {
        return formatRGB(color);
      }
    },
    [year, domain]
  );

  const getLineColor = useCallback(
    (d) => {
      if (!!indexedSelectedCountries[d?.properties?.ADMIN]) {
        return [255, 0, 0, 1];
      }
      return [255, 255, 255, 255];
    },
    [indexedSelectedCountries]
  );

  const layer = useMemo(
    () =>
      new GeoJsonLayer({
        id: layerId,
        data,
        stroked: true,
        getLineWidth: 1,
        lineWidthScale: 2,
        lineWidthMinPixels: 0.5,
        getPolygon,
        extruded: false,
        pickable: true, // enables picking of the elements
        onClick,
        getFillColor,
        getLineColor,
        updateTriggers: {
          getLineColor: [selectedCountries],
        },
        transitions: {
          getLineColor: 1000,
        },
      }),
    [data, onClick, getFillColor, getLineColor, selectedCountries]
  );

  if (!data?.features || !domain) return [undefined, undefined];
  return [layer, colorScale];
};

const elevationScale = scaleLinear().range([200, 600]).domain([50, 100]);

// LIFE EXP ALL
export const useColLifeExpAllLayer = (data, year) => {
  const getElevation = useCallback(
    (d) => {
      const lifeExp = getLifeExpAll(year)(d);

      return elevationScale(lifeExp);
    },
    [year]
  );

  const getFillColor = useCallback(
    (d) => {
      const lifeExp = getLifeExpAll(year)(d);
      const color = seqColorScale(interpolateInferno)(lifeExp);
      if (color.startsWith("#")) {
        const { red, green, blue } = hexRgb(color);
        return [red, green, blue];
      } else {
        return formatRGB(color);
      }
    },
    [year]
  );

  const layer = useMemo(
    () =>
      new ColumnLayer({
        id: "colLifeExpAll",
        data: data?.features,

        /* props from ColumnLayer class */

        angle: -45,
        coverage: 2,
        diskResolution: 1000,
        elevationScale: 1000,
        extruded: true,
        getElevation,
        getFillColor,
        getLineWidth: 400,
        getPosition,
        material: false,
        radius: 25000,
        stroked: false,
        highlightColor: [0, 0, 128, 128],
        opacity: 0.35,
        pickable: true,
      }),
    [data?.features, getElevation, getFillColor]
  );

  if (!data?.features) return undefined;

  return layer;
};

export const useColLifeExpMaleLayer = (data, year, layerId, radius, heightMultiplier, middleOffset) => {
  const getElevation = useCallback(
    (d) => {
      const lifeExp = getLifeExpMale(year)(d);

      return elevationScale(lifeExp) * heightMultiplier;
    },
    [year]
  );

  const getColPosition = useCallback((d) => {
    const position = getPosition(d);
    return [position[0] + middleOffset, position[1]];
  }, []);

  const getFillColor = useCallback(
    (d) => {
      const lifeExp = getLifeExpMale(year)(d);
      const color = seqColorScale(interpolateBlues)(lifeExp);
      if (color.startsWith("#")) {
        const { red, green, blue } = hexRgb(color);
        return [red, green, blue];
      } else {
        return formatRGB(color);
      }
    },
    [year]
  );

  const layer = useMemo(
    () =>
      new ColumnLayer({
        id: layerId,
        data: data?.features,

        /* props from ColumnLayer class */

        angle: -45,
        coverage: 2,
        diskResolution: 1000,
        elevationScale: 1000,
        extruded: true,
        getElevation,
        getFillColor,
        getLineWidth: 400,
        getPosition: getColPosition,
        material: false,
        radius: radius,
        stroked: false,
        highlightColor: [0, 0, 128, 128],
        opacity: 0.5,
        pickable: true,
      }),
    [data?.features, getElevation, getFillColor, getColPosition]
  );

  if (!data?.features) return undefined;

  return layer;
};

export const useColLifeExpFemaleLayer = (data, year, layerId, radius, heightMultiplier, middleOffset) => {
  const getElevation = useCallback(
    (d) => {
      const lifeExp = getLifeExpFemale(year)(d);

      return elevationScale(lifeExp) * heightMultiplier;
    },
    [year]
  );

  const getColPosition = useCallback((d) => {
    const position = getPosition(d);
    return [position[0] + middleOffset, position[1]];
  }, []);

  const getFillColor = useCallback(
    (d) => {
      const lifeExp = getLifeExpFemale(year)(d);
      const color = seqColorScale(interpolatePuRd)(lifeExp);
      if (color.startsWith("#")) {
        const { red, green, blue } = hexRgb(color);
        return [red, green, blue];
      } else {
        return formatRGB(color);
      }
    },
    [year]
  );

  const layer = useMemo(
    () =>
      new ColumnLayer({
        id: layerId,
        data: data?.features,

        /* props from ColumnLayer class */

        angle: -45,
        coverage: 2,
        diskResolution: 1000,
        elevationScale: 1000,
        extruded: true,
        getElevation,
        getFillColor,
        getLineWidth: 400,
        getPosition: getColPosition,
        material: false,
        radius: radius,
        stroked: false,
        highlightColor: [0, 0, 128, 128],
        opacity: 0.5,
        pickable: true,
      }),
    [data?.features, getElevation, getFillColor, getColPosition]
  );

  if (!data?.features) return undefined;

  return layer;
};

export const useBandLinScale = (xValues, yValues, width, height, isChartEmpty, isChartVertical, bandPadding = 0) =>
  useMemo(() => {
    if (isChartEmpty) {
      return {
        yScale: (v) => 0,
        xScale: (v) => 0,
      };
    }

    return {
      xScale: isChartVertical ? getBandScale(xValues, [0, width], bandPadding) : getLinearScale(xValues, [0, width]),
      yScale: isChartVertical ? getLinearScale(yValues, [height, 0]) : getBandScale(yValues, [height, 0], bandPadding),
    };
  }, [bandPadding, height, isChartEmpty, isChartVertical, width, xValues, yValues]);

export const useTooltipConfigs = (
  xPadding,
  yPadding,
  chartHeight,
  variant,
  xScale,
  yScale,
  formatXScale,
  formatYScale
) => {
  const [pointTooltip, setPointTooltip] = useState();
  const [xTooltip, setXTooltip] = useState();
  const [yTooltip, setYTooltip] = useState();

  const { containerRef, containerBounds } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const handleMouseLeave = (event, pointGroup) => {
    const noTooltipData = {
      tooltipLeft: undefined,
      tooltipTop: undefined,
      tooltipData: undefined,
    };

    if (pointGroup) setPointTooltip(noTooltipData);

    setYTooltip(noTooltipData);
    setXTooltip(noTooltipData);
  };

  const getAxisTooltipData = useCallback((scale, isScaleLinear, formatter, coordinate) => {
    if (isNil(coordinate)) return undefined;
    const value = scale.invert(coordinate);

    return formatter ? formatter(value) : value;
  }, []);

  const handleHover = useCallback(
    (event, pointGroup) => {
      const top = "clientY" in event ? event.clientY : 0;
      const left = "clientX" in event ? event.clientX : 0;
      setPointTooltip({
        tooltipLeft: left - containerBounds.left,
        tooltipTop: top - containerBounds.top,
        tooltipData: pointGroup?.points,
      });
      setYTooltip({
        tooltipLeft: xPadding,
        tooltipTop: top - containerBounds.top,
        tooltipData: getAxisTooltipData(
          yScale,
          true,
          formatYScale,
          top > yPadding + containerBounds.top ? top - yPadding - containerBounds.top : 0
        ),
      });
      setXTooltip({
        tooltipLeft: left - containerBounds.left,
        tooltipTop: chartHeight + yPadding,
        tooltipData: getAxisTooltipData(
          xScale,
          true,
          formatXScale,
          left > xPadding + containerBounds.left ? left - xPadding - containerBounds.left : 0
        ),
      });
    },
    [containerBounds, xPadding, getAxisTooltipData, yScale, formatYScale, yPadding, chartHeight, xScale, formatXScale]
  );

  return {
    pointTooltip,
    xTooltip,
    yTooltip,
    handleHover,
    handleMouseLeave,
    containerRef,
  };
};

export const useMapViewState = () => {
  const initViewState = {
    latitude: 10.3,
    longitude: 18.31,
    zoom: 2,
    minZoom: 2,
    maxZoom: 8,
    pitch: 45,
    bearing: 0,
    maxPitch: 60,
    minPitch: 20,

    width: "100vw",
    height: "100vh",
  };

  const onViewStateChange = ({ viewState }) => {
    if (viewState.latitude > 75) {
      viewState.latitude = 75;
    } else if (viewState.latitude < -45) {
      viewState.latitude = -45;
    }

    // update mapbox
    return viewState;
  };

  return { onViewStateChange, initViewState };
};

export const useCountriesWithColors = (countries = []) =>
  countries.map((country) => ({
    ...country,
    object: {
      ...country.object,
      properties: {
        ...country.object.properties,
        chartColor: lineChartColorScheme[country.index % lineChartColorScheme.length],
      },
    },
  }));

export function useClosestPoints(event, xScale, yScale, series = [], xPadding = 15) {
  const [closestPoints, setClosestPoints] = useState();

  const addPoint = useCallback((accum = [], color, data, x, y) => {
    const pointGroupId = `${x}-${y}`;
    const pointGroup = accum[pointGroupId] ?? { x, y };
    const points = pointGroup?.points ?? [];
    const point = {
      color,
      data,
    };
    return {
      ...accum,
      [pointGroupId]: {
        ...pointGroup,
        points: [...points, point],
      },
    };
  }, []);

  const handleSetPoints = useCallback(() => {
    if (!event || !event.target || !xScale || !yScale) {
      setClosestPoints(undefined);
      return;
    }

    const targetName = event?.target?.localName;
    if (targetName !== "path" && targetName !== "rect") return;

    const { y, x } = localPoint(event) || { x: 0, y: 0 };
    let points;

    const [xValue, xCoordinate] = getClosestCoordinate(xScale, x - xPadding, ChartVariant.vertical);

    // Find all the corresponding linear coord based on band coord
    points = series.reduce((accum, serie) => {
      const { datapoints = [], color } = serie;
      const data = datapoints.find((datum) => datum.valueX === xValue);
      if (isNil(data)) return accum;

      let yVal = data?.valueY;
      const yCoordinate = yScale(yVal);
      if (isNil(yCoordinate)) return accum;
      return addPoint(accum, color, data, xCoordinate, yCoordinate);
    }, []);

    setClosestPoints(points);
  }, [addPoint, event, series, xPadding, xScale, yScale]);

  useEffect(() => {
    handleSetPoints();
  }, [handleSetPoints]);

  return closestPoints;
}
