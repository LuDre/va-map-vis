import { AxisLeft, AxisBottom } from "@visx/axis";
import { GridColumns, GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { ParentSize } from "@visx/responsive";
import React, { useCallback, useMemo } from "react";
import { flatMap, flow, isNil, uniq } from "lodash";

import ChartOverlays from "../ChartOverlays";
import ChartTooltips from "../ChartTooltips/ChartTooltips";
import { useTooltipConfigs } from "../hooks";
import { formatAxisTick, getAxisTickLabelProps, getLinearScale } from "../utils";
import { ChartVariant, AxisVariant } from "../consts";

import "./LineChart.scss";

const CHART_X_PADDING = 40;
const CHART_Y_PADDING = 30;

const GRAY = "#E1E5EA";

const getUniqueFlatValues = (prop, data) =>
  flow((d) => flatMap(d, (lineData) => lineData?.datapoints?.map((datum) => datum?.[prop])), uniq)(data);

/**
 * Line chart has two axes: one of them uses linear scale, and another uses band scale.
 * The vertical (default) variant renders vertical bars with band x-axis and linear y-axis.
 * The horizontal variant renders horizontal bars with linear x-axis and band y-axis.
 */

const LineChart = ({
  width = 900,
  height = 460,
  heading,
  variant = ChartVariant.vertical,
  data,
  formatXScale,
  formatYScale,
  numXAxisTicks = 8, // approximate
  numYAxisTicks = 8,
  padding = {
    top: CHART_Y_PADDING,
    bottom: CHART_Y_PADDING,
    left: CHART_X_PADDING,
    right: CHART_X_PADDING,
  },
}) => {
  const cleanWidth = useMemo(() => {
    const clean = width - padding.left - padding.right;
    return clean > 0 ? clean : 0;
  }, [padding.left, padding.right, width]);
  const cleanHeight = useMemo(() => height - 2 * padding.top - padding.bottom, [height, padding.bottom, padding.top]);

  const isVertical = useMemo(() => variant === ChartVariant.vertical, [variant]);

  const xValues = getUniqueFlatValues("valueX", data);
  const yValues = getUniqueFlatValues("valueY", data);

  const xTickWidth = useMemo(
    () => (isVertical ? cleanWidth / xValues.length : cleanWidth / numXAxisTicks),
    [cleanWidth, isVertical, numXAxisTicks, xValues.length]
  );

  const xScale = getLinearScale(xValues, [0, cleanWidth]);
  const yScale = getLinearScale(yValues, [cleanHeight, 0]);

  const renderLine = useCallback(
    (lineData) => {
      const getX = (lineDatum) => {
        const x = xScale(lineDatum?.valueX);
        const offset = 0; //isVertical ? xScale.bandwidth() / 2 : 0;
        return x + offset;
      };

      const getY = (lineDatum) => {
        const y = yScale(lineDatum?.valueY);
        const offset = 0; //isVertical ? 0 : yScale.bandwidth() / 2;

        return y + offset;
      };
      return (
        <LinePath
          key={lineData?.label}
          data={lineData?.datapoints}
          x={getX}
          y={getY}
          stroke={lineData?.color}
          strokeWidth={2}
        />
      );
    },
    [xScale, yScale]
  );

  const { pointTooltip, xTooltip, yTooltip, handleHover, handleMouseLeave, containerRef } = useTooltipConfigs(
    padding.left,
    padding.top,
    cleanHeight,
    variant,
    xScale,
    yScale,
    formatXScale,
    formatYScale
  );

  return (
    <>
      <h4 className="LineChart__heading">{heading}</h4>
      <div className="LineChart__wrapper">
        <svg width={width} height={height} ref={containerRef}>
          <Group left={padding.left} top={padding.top}>
            {variant === ChartVariant.vertical ? (
              <GridRows scale={yScale} width={cleanWidth} height={cleanHeight} stroke={GRAY} />
            ) : (
              <GridColumns scale={xScale} width={cleanWidth} height={cleanHeight} stroke={GRAY} />
            )}
            <AxisBottom
              top={cleanHeight}
              scale={xScale}
              hideTicks
              hideAxisLine
              tickFormat={formatAxisTick(formatXScale)}
              tickLabelProps={getAxisTickLabelProps()}
              numTicks={numXAxisTicks}
            />
            <AxisLeft
              scale={yScale}
              hideTicks
              hideAxisLine
              tickFormat={formatAxisTick(formatYScale)}
              tickLabelProps={getAxisTickLabelProps(AxisVariant.left)}
              numTicks={numYAxisTicks}
            />
            {data?.map(renderLine)}
          </Group>
          <ChartOverlays
            offsetLeft={padding.left}
            offsetTop={padding.top}
            width={cleanWidth}
            height={cleanHeight}
            xScale={xScale}
            yScale={yScale}
            dataSeries={data}
            variant={variant}
            onHover={handleHover}
            onMouseLeave={handleMouseLeave}
          />
        </svg>
        <ChartTooltips pointTooltip={pointTooltip} xTooltip={xTooltip} yTooltip={yTooltip} />
      </div>
    </>
  );
};

export default function ResponsiveLineChart({
  width = 900,
  height = 460,
  heading,
  variant = ChartVariant.vertical,
  data,
  formatXScale,
  formatYScale,
  numXAxisTicks = 8, // approximate
  numYAxisTicks = 8, // approximate
  isResponsive = true,
  padding,
}) {
  const renderChart = useCallback(
    (chartWidth, chartHeight) => (
      <LineChart
        width={chartWidth}
        height={chartHeight}
        heading={heading}
        variant={variant}
        data={data}
        formatXScale={formatXScale}
        formatYScale={formatYScale}
        numXAxisTicks={numXAxisTicks} // approximate
        numYAxisTicks={numYAxisTicks}
        padding={padding}
      />
    ),
    [data, formatXScale, formatYScale, heading, numXAxisTicks, numYAxisTicks, variant, padding]
  );

  const renderResponsiveChart = useCallback(
    (parent) => {
      const responsiveWidth = !isNil(width) && Math.min(width, parent.width);
      const responsiveHeight = !isNil(height) && Math.min(height, parent.height);

      return renderChart(responsiveWidth, responsiveHeight);
    },
    [renderChart, width, height]
  );

  if (!isResponsive) return renderChart(width);
  return (
    <ParentSize parentSizeStyles={{ maxHeight: height, maxWidth: width, height, margin: "0 0 0.5rem 0" }}>
      {renderResponsiveChart}
    </ParentSize>
  );
}
