import { LegendLinear, LegendItem } from "@visx/legend";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";

import "./MapLegend.scss";

const legendGlyphHeight = 20;
const legendGlyphWidth = 60;

const MapLegend = ({ scale, label, onSwitchMetric }) => {
  return (
    // <LegendDemo title="Threshold">
    <div className="MapLegend">
      <ToggleSwitch id="ground" checked={label !== "Immunization"} onChange={onSwitchMetric} />
      <h3 className="MapLegend__header">{label}</h3>
      <LegendLinear scale={scale}>
        {(labels) => (
          <div className="MapLegend__items">
            {labels.map((label, i) => {
              const width = Math.max(legendGlyphWidth, `${label.text}`.length * 8);
              return (
                <LegendItem key={`legend-quantile-${i}`}>
                  <svg width={width} height={legendGlyphHeight}>
                    <g>
                      <rect fill={label.value} x={0} y={0} width={width} height={legendGlyphHeight} />
                      <text x="50%" y="50%" className={"MapLegend__label"}>
                        {Math.round(label.text)}
                        {i === labels.length - 1 ? "+" : ""}
                      </text>
                    </g>
                  </svg>
                </LegendItem>
              );
            })}
          </div>
        )}
      </LegendLinear>
      <div className="MapLegend__lifeExpectancy">
        The brightness and the height of bars
        <br />
        describes the average life expectancy.
      </div>
    </div>
  );
};

export default MapLegend;
