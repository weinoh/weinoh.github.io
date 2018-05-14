//Width and height of map
var w_map = .8 * window.innerWidth;
var h_map = window.innerHeight;
var padding_map = .05 * window.innerHeight;
var padding_m = 10;

var w_t = w_map / 2;
var h_t = h_map / 4;
var padding_t = 30;

var scale_whole = 55 * w_map;

var xScale,
  yScale,
  xAxis,
  yAxis,
  line;

var showBlack = false;
var showWhite = false;
var showAsian = false;
var showNative = false;
var showHispanic = false;
var showAll = false;

var frisk_data,
  friskByTime;


var projection = d3.geoMercator()
  .center([-73.9352, 40.7128])
  .translate([(w_map / 3), (2 * h_map / 5)])
  .scale([scale_whole]);

//Define path generator, using the Albers USA projection
var path = d3.geoPath()
  .projection(projection);


var toggle = function(booleanVar) {
  if (booleanVar) {
    booleanVar = false;
  } else {
    booleanVar = true
  }
}
// var color = d3.scaleQuantize()
//   .range(["rgb(28, 194, 10)", "rgb(118, 196, 11)",
//     "rgb(198, 188, 12)", "rgb(200, 102, 14)",
//     "rgb(203, 16, 16)"]);

// Create SVG element
var background_svg = d3.select("#background_svg")
  .append("svg")
  .attr("width", w_map)
  .attr("background-color", "rgb(155,155,0)");


var nycmap_svg = d3.select("#nyc_map")
  .append("svg")
  // .attr("y", padding_map)
  .attr("width", w_map)
  .attr("height", h_map)
  .attr("background-color", "rgb(155,155,0)");

// var timeline_svg = d3.select("#timeline")
  //   .append("svg")
  //   .attr("width", w_t)
  //   .attr("height", h_t);


// d3 functions for parsing dates and times
var parseDate = d3.timeParse("%x");
var parseTime = d3.timeParse("%H%M");
var reparseDate = d3.timeParse("%a %b %d, %Y")

var parseDateTime = d3.timeParse("%x %X")
//For converting Dates to strings
var formatTime = d3.timeFormat("%Y");

var formatTimeClock = d3.timeFormat("%H:%M");


var friskRowConverter = function(data) {
  return {
    date: parseDate(data.datestop),
    time: parseTime(data.timestop),
    arrested: data.arstmade.trim(),
    frisked: data.frisked.trim(),
    searched: data.searched.trim(),
    forceUsed: data.forceuse.trim(),
    gender: data.sex.trim(),
    race: data.race.trim(),
    age: parseInt(data.age),
    zip: parseFloat(data.zip),
    long: parseFloat(data.longitude),
    lat: parseFloat(data.latitude),
    crime_code: parseInt(data.detailCM)
  }
}



//////////////////////////////////////////////////////////////////
//Load in GeoJSON data
//////////////////////////////////////////////////////////////////
d3.json("./geojson/nyc_zip.geojson", function(json) {

  nycmap_svg.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke-width", 1.5)
    .attr("stroke", "white")
    .attr("fill", function(d) {
      //Get data value
      var value = d.properties.value;
      if (value) {
        //If value exists…
        console.log("we get in here")
        return color(value);
      } else {
        //If value is undefined…
        return "#ccc";
      }
    });



  ////////////////////////////////////////////////////////////////////////////////////////
  //Load in FRISK DATA
  d3.csv("./csv/stop_frisk.csv", friskRowConverter, function(error, data) {

    // ERROR HANDLING
    if (error && error.status === 404) {
      console.log("File not found");
    }
    if (data.length == 0) {
      console.log("File empty");
    }
    // END ERROR HANDLING

    // DATA LOAD
    frisk_data = data
    frisk_data = frisk_data.filter(function(d) {
      return (d.time != "" && d.time != null && !(isNaN(d.time)));
    });

    // // GROUP BY TIME
    // friskByTime = d3.nest()
    //   .key(function(d) {
    //     return d.time;
    //   })
    //   .rollup(function(v) {
    //     return v.length
    //   })
    //   .entries(frisk_data);
    //
    // console.log(friskByTime);
    // // SORT BY TIME
    // friskByTime.sort(function(x, y) {
    //   return d3.ascending(x.key, y.key);
    // });


    //////////////////////////////////////////
    // Draw circles for first time for murders
    circles = nycmap_svg.selectAll("circle")
      .data(frisk_data)
      .enter()
      .append("circle")
      .attr("cx", function(d) {
        if (projection([d.long, d.lat])[0]) {
          return projection([d.long, d.lat])[0];
        } else {
          return 0;
        }

      })
      .attr("cy", function(d) {
        if (projection([d.long, d.lat])[1]) {
          return projection([d.long, d.lat])[1];
        } else {
          return 0;
        }
      })
      .attr("r", 1.5)
      .attr("stroke", "black")
      .attr("stroke-width", 0.25)
      .attr("fill", "#f8f8ff");
      // .attr("class", function(d) {
      //
      //   if (isBrushed(parseTime("20:00"),
      //       parseTime("23:59"), d.time)) {
      //     return "brushed";
      //   } else {
      //     return "nonbrushed";
      //   }
      // });
      // END OF CIRCLE DRAWING


      // //////////////////////////////////////////////////////////////////////
      // // Graph for Brushing
      // //////////////////////////////////////////////////////////////////////
      // //Discover start and end dates in dataset
      // var startTime = d3.min(friskByTime, function(d) {
      //   return parseTime(d.key);
      // });
      // var endTime = d3.max(friskByTime, function(d) {
      //   return parseTime(d.key);
      // });
      //
      // //Create scale functions
      // xScale = d3.scaleTime()
      //   .domain([
      //     startTime, //startDate minus one day, for padding
      //     endTime //endDate plus one day, for padding
      //
      //   ])
      //   .rangeRound([padding_t, w_t - padding_t]);
      //
      //
      // yScale = d3.scaleLinear()
      //   .domain([0, d3.max(friskByTime, function(d) {
      //     return d.value;
      //   })])
      //   .rangeRound([h_t - padding_t, padding_t]);
      //
      // //Define axes
      // xAxis = d3.axisBottom()
      //   .scale(xScale)
      //   .ticks(10)
      //   .tickFormat(formatTimeClock);
      //
      // //Define Y axis
      // yAxis = d3.axisLeft()
      //   .scale(yScale)
      //   .ticks(10);
      //
      // // text label for the x axis
      // timeline_svg.append("text")
      //   .attr("transform",
      //     "translate(" + (w_t / 2) + " ," +
      //     (h_t) + ")")
      //   .style("text-anchor", "middle")
      //   .attr("font-size", 12)
      //   .attr("font-family", "Helvetica Neue")
      //   .attr("font-weight", "bold")
      //   .text("Time");
      //
      // // text label for the y axis
      // timeline_svg.append("text")
      //   .attr("transform", "rotate(-90)")
      //   .attr("y", padding_t / 2.5)
      //   .attr("x", (0 - (h_t / 2)))
      //   .style("text-anchor", "middle")
      //   .attr("font-size", 12)
      //   .attr("font-family", "Helvetica Neue")
      //   .attr("font-weight", "bold")
      //   .text("# Stopped");
      //
      //
      // line = d3.line()
      //   .x(function(d) {
      //     return xScale(d.key);
      //   })
      //   .y(function(d) {
      //     return yScale((d.value));
      //   });
      //
      // //Create line
      // timeline_svg.append("path")
      //   .datum(friskByTime)
      //   .attr("class", "line")
      //   .attr("d", line)
      //   //.attr("fill", "none")
      //   // .attr("stroke-linejoin", "round")
      //   .attr("stroke-linecap", "round")
      //   //.attr("stroke", "rgb(25,76,35)")
      //   .attr("stroke-width", 2.5);
      //
      //
      //
      // //Create axes
      // timeline_svg.append("g")
      //   .attr("class", "axis")
      //   .attr("transform", "translate(0," + (h_t - padding_t) + ")")
      //   .call(xAxis);
      //
      // timeline_svg.append("g")
      //   .attr("class", "axis")
      //   .attr("transform", "translate(" + padding_t + ",0)")
      //   .call(yAxis);
      //
      //
      //
      //
      // ////////////////////////////////////////////////////////////////////
      //   // Brush functions
      //   ////////////////////////////////////////////////////////////////////
      //
      //
      // var brush = d3.brushX(xScale)
      //   .on("brush end", highlightBrushedCircles);
      //
      //
      //
      // var g = timeline_svg.append("g")
      //   .attr("height", (h_t - (2 * padding_t)))
      //   .attr("transform", "translate(" + 0 + "," + padding_t + ")");
      //
      //
      // var gBrush = g.append("g")
      //   .attr("class", "brush")
      //   .call(brush);
      //
      // gBrush.call(brush.move, [xScale(parseTime("20:00:00")), xScale(parseTime("23:59:00"))]);
      //
      //
      //
      //
      //
      //
      //
      // function highlightBrushedCircles() {
      //   // revert circles to initial style
      //   nycmap_svg.selectAll("circle").classed("brushed", false);
      //   nycmap_svg.selectAll("circle").attr("class", "nonbrushed");
      //
      //
      //   var maxTime = xScale.invert(d3.event.selection[1]);
      //   var minTime = xScale.invert(d3.event.selection[0]);
      //
      //
      //   // style brushed circles
      //   nycmap_svg.selectAll("circle").filter(function(d) {
      //     var currTime = d.time;
      //     return isBrushed(parseDate(minTime), parseDate(maxTime), currTime);
      //   })
      //     .classed("brushed", true);
      // }
      //
      //
      //
      //
      // function isBrushed(firstTime, lastTime, currentTime) {
      //   console.log(firstTime);
      //   console.log(currentTime);
      //   console.log(lastTime);
      //
      //   if ((d3.max([firstTime, currentTime]) === currentTime)
      //     && (d3.min([lastTime, currentTime]) === currentTime)) {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // }
      //
      //
      //
      // //////////////////////////////////////////////////////////////////////






  });
  // END OF LOADING IN FRISK DATA






});
// end of GEOJSON loading




////////////////////////////////////////////////////////////////////////////////
////// UPDATE FUNCTIONS
////////////////////////////////////////////////////////////////////////////////
d3.selectAll('button.nyc_map')
  .on('click', function() {
    var self = this.id;
    console.log('INSIDE OF BUTTON FUNCTION')
    console.log(self)
    switch (self) {
      case 'whiteButton':
        if (showWhite) {
          showWhite = false;
        } else {
          showWhite = true
        }
        break;
      case 'blackButton':
        if (showBlack) {
          showBlack = false;
        } else {
          showBlack = true
        }
        break;
      case 'asianButton':
        if (showAsian) {
          showAsian = false;
        } else {
          showAsian = true
        }
        break;
      case 'nativeButton':
        if (showNative) {
          showNative = false;
        } else {
          showNative = true
        }
        break;
      case 'hispanicButton':
        if (showHispanic) {
          showHispanic = false;
        } else {
          showHispanic = true
        }
        break;
      case 'allButton':
        var showButton = window.parent.document.getElementById('allButton');
        if (showAll) {
          showButton.innerHTML = 'Show All'
          showAll = false;
          showHispanic = false;
          showBlack = false;
          showWhite = false;
          showAsian = false;
          showNative = false;
        } else {
          showButton.innerHTML = 'Reset'
          showAll = true;
        }
        break;
      default:
        console.log('NONE');
    }
    // END SWITCH STATEMENT
    update_circles_color();

  });
  // END OF ON CLICK


// UPDATE circles
var update_circles_color = function() {

  d3.selectAll("#nyc_map circle")
    .attr("fill", function(d) {
      if ((showAll || showBlack) && (d.race == "B")) {
        // BLACK
        return "#b22222"
      } else if ((showAll || showWhite) && (d.race == "W")) {
        // WHITE
        return "#00ffec"
      } else if ((showAll || showAsian) && (d.race == "A")) {
        // ASIAN
        return "#00ff2b"
      } else if ((showAll || showNative) && (d.race == "I")) {
        // NATIVE AMERICAN
        return "#ff69b4"
      } else if ((showAll || showHispanic) && (d.race == "P" || d.race == "Q")) {
        // HISPANIC
        return "#FFA500"
      } else {
        return "#f8f8ff"
      }
    })
    .transition()
    .duration();
}
