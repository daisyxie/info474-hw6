'use strict';

(function() {

  let data = "no data";
  let allData = "no data";
  let svgLineGraph = "";
  let svgScatterPlot = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
      
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allData = csvData;
        makeDropdown();
        makeLineGraph("AUS"); //default country
      });
  }
  
  // makes dropdown for country
  function makeDropdown() {
    //dropdown with years as selections
    let dropDown = d3.select("body").append("div")
      .append("select")
      .attr("class", "dropdown");
    // get array of years
    let optionData = d3.map(allData, function(d) {return d.location;}).keys();

    let options = dropDown.selectAll("option")
      .data(optionData)
      .enter()
      .append("option")

    options.text(function (d) {return d; })
      .attr("value", function (d) {return d; });

    dropDown.on("change", function() {
      let country = this.value;
      makeLineGraph(country);
    });
  }

  // make default graph
  function makeLineGraph(country) {
    svgLineGraph.html("");
    let countryData = allData.filter((row) => row["location"] == country);
    let timeData = countryData.map((row) => +row["time"]);
    let pop_data = countryData.map((row) => +row["pop_mlns"]);

    let minMax = findMinMax(timeData, pop_data);

    let funcs = drawAxes(minMax, "time", "pop_mlns", svgLineGraph, 
    {min: 50, max: 450}, 
    {min: 10, max: 450}, true);
    
    plotLineGraph(funcs, countryData, country);
  }

  // plot default graph
  function plotLineGraph(funcs, countryData, country) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));
  
    svgLineGraph.append('path')
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeScatterPlot();
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgLineGraph.append('text')
      .attr('x', 150)
      .attr('y', 20)
      .style('font-size', '14pt')
      .text("Population Size Over Time");

    svgLineGraph.append('text')
      .attr('x', 240)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population Size (millions)');

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    svgScatterPlot = div.append("svg")
      .attr('width', 250)
      .attr('height', 250);
  }

  // make scatter plot
  function makeScatterPlot() {
    // get data as arrays
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot, {min: 40, max: 230}, {min: 20, max: 210}, false);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    svgScatterPlot.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 3)
      .attr('fill', "#4286f4")
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 40)
      .attr('y', 25)
      .style('font-size', '10pt')
      .text("Life Expectancy vs. Fertility Rate");

    svgScatterPlot.append('text')
      .attr('x', 45)
      .attr('y', 240)
      .style('font-size', '8pt')
      .text('Fertility Rates (avg children / woman)');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .attr('x', 110)
      .style('font-size', '8pt')
      .text('Life Expectancy (years)');
  }

  function parseYear(date) {
    let parse = d3.timeParse("%Y");
    return parse(date);
  }



  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY, isYear) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = "";
    //use different scale if x-axis is year
    if (isYear) {
      xScale = d3.scaleTime()
      .range([rangeX.min, rangeX.max]);
    } else {
      xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);
    }

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    //parse date to make x-axis in years
    if (isYear) {
      xScale.domain(d3.extent(data, function(d) {return parseYear(d[x]);}))
    }
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);
    //change domain to allow calculation of points (no parsing of date)
    xScale.domain(d3.extent(data, function(d) {return d[x];}))

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
    .domain([limits.yMax, limits.yMin]) // give domain buffer
    .range([rangeY.min + 20, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }
})();