import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { api } from "../api";
import { Stage, Title, Content } from "../components/stage";

import * as d3 from "d3";
// import { timeParse, format, select } from "d3";

import { extent, max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
import { utcFormat } from "d3-time-format";
// import { Dropdown, timespans, url } from "../utils";
// import { newAtom } from "../atoms";

let parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");

export const formatPoint = (i) => ({
  date: parseTime(i.t),
  value: i.v,
});

export const draw = (data, elementRef) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

  const width = 600;
  const height = 338;

  const xScale = scaleUtc()
    .domain(extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = scaleLinear()
    .domain(extent(data, (d) => d.value))
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Build the x-axis
  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        axisBottom(xScale)
          // Format the date shown on the x-axis
          .tickFormat(utcFormat("%b, %Y"))
        // %Y-%m-%dT%H:%M:%S
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)");

  // Build the y-axis
  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(axisLeft(yScale).tickFormat((d) => `${d3.format(".2s")(d)}`));

  const initLine = line()
    .defined((d) => !isNaN(d.value))
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  const svgEl = d3.select(elementRef.current);
  svgEl.selectAll("*").remove();

  const svg = svgEl.append("g").attr("width", width).attr("height", height);

  // axes
  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  // svg
  //   .append("path")
  //   .datum(data)
  //   .attr("d", initLine)
  //   .attr("fill", "none")
  //   .attr("stroke", "steelblue")
  //   .attr("stroke-width", 1.5);

  const barWidth = (width - margin.right - margin.left) / data.length;

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr(
      "transform",
      (d) => `translate(${xScale(d.date)}, ${yScale(d.value || 0)})`
    )
    .attr("fill", "#000000")
    .attr("width", barWidth)
    .attr("height", (d) => height - margin.bottom - yScale(d.value || 0))
    .attr("opacity", 0.1);
};

export default () => {
  // const { code } = useParams();

  const [data, setData] = useState([]);
  // const [error, setError] = useState();
  // const [complete, setComplete] = useState(false);
  // const [working, setWorking] = useState(false);

  const someRef = useRef(null);

  useEffect(() => {
    if (data.length && someRef.current) {
      draw(data, someRef);
    }
  }, [data, someRef]);

  useEffect(() => {
    api.get("/statistics").then((response) => {
      // setData(response.data);
      if (response.data?.comments) {
        setData(
          Object.values(response.data.comments).map((entry) => ({
            date: parseTime(entry.date),
            value: entry.value,
          }))
        );
      }
    });
    // .catch(({ response }) => setError(response?.data))
  }, []);

  // const { current_time: currentTime, comments } = data;

  // if (!thread?.id) {
  //   return null;
  // }

  // console.log(currentTime);

  return (
    <Stage>
      <Title>Things about stuff</Title>

      <StyledContent>
        <h4>Total comments over time</h4>
        <svg
          ref={someRef}
          viewBox={`0 0 600 338`}
          preserveAspectRatio="xMidYMid meet"
        />
      </StyledContent>
    </Stage>
  );
};

const StyledContent = styled(Content)`
  svg {
    width: 100%;
    aspect-ratio: 16/9;
  }
`;
