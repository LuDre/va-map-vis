import React from "react";
import { isNil, noop } from "lodash";
import { Group } from "@visx/group";

export default function DataPointIndicator({ x, y, handleMouseMove = noop, handleMouseLeave = noop, color = "red" }) {
  if (isNil(x) || isNil(y)) return null;
  return (
    <Group>
      <circle
        cx={x}
        cy={y}
        r={9}
        fill={"white"}
        stroke={"black"}
        strokeWidth={1}
        pointerEvents="all"
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <circle
        cx={x}
        cy={y}
        r={4}
        fill={color}
        stroke="none"
        pointerEvents="all"
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </Group>
  );
}
