////////////////////////////////////////////////////////////////////////////////
// MAP VARIABLES / SETUP
////////////////////////////////////////////////////////////////////////////////
//Width and height of map, padding
var w_map = document.getElementById("nyc_map").offsetWidth;
var h_map = window.innerHeight * (3 / 4);
var padding_map = .05 * window.innerHeight;
var padding_m = 10;
// Scale for map.
var scale_whole = 70 * w_map;
// Define projection, mercator
var projection = d3.geoMercator()
  .center([-73.9352, 40.7128])
  .translate([(w_map / 2), ((h_map - padding_map) / 2)])
  .scale([scale_whole]);
//Define path generator, using the Albers USA projection
var path = d3.geoPath()
  .projection(projection);

// Boolean vars to control buttons/data shown for map
var showBlack = false;
var showWhite = false;
var showAsian = false;
var showNative = false;
var showHispanic = false;
var showAll = false;
var showOther = false;
var showCircle = true;

// Append SVG for NYC Map
var nycmap_svg = d3.select("#nyc_map")
  .append("svg")
  // .attr("y", padding_map)
  .attr("width", w_map)
  .attr("height", h_map)
  .attr("background-color", "rgb(155,155,0)");

////////////////////////////////////////////////////////////////////////////////
// TIMELINE HISTOGRAM VARIABLES / SETUP
////////////////////////////////////////////////////////////////////////////////
// Width and Height of Timeline
var w_t = document.getElementById("timeline").offsetWidth;
var h_t = h_map / 2;
var padding_t = w_t / 10;
// Append SVG For Hour Histogram
var timeline_svg = d3.select("#timeline")
  .append("svg")
  .attr("width", w_t)
  .attr("height", h_t);
// Graphing variables, timeline
var xScale,
  yScale,
  xAxis,
  yAxis,
  line;

var times = ["1:00 am", "2:00 am", "3:00 am",
  "4:00 am", "5:00 am", "6:00 am",
  "7:00 am", "8:00 am", "9:00 am",
  "10:00 am", "11:00 am", "12:00 pm",
  "1:00 pm", "2:00 pm", "3:00 pm",
  "4:00 pm", "5:00 pm", "6:00 pm",
  "7:00 pm", "8:00 pm", "9:00 pm",
  "10:00 pm", "11:00 pm", "12:00 am"]



var formatTime = d3.timeFormat("%H:%M");
// d3 functions for parsing dates and times

var parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var parseTime = d3.timeParse("%H:%M");
var parseRandom = d3.timeParse("%Y-%m-%d %H:%M");

var reformatTime = d3.timeFormat("%I:%M %p");

var realTimes = [formatTime("00:00"), formatTime("01:00"), formatTime("02:00"), formatTime("03:00"),
  formatTime("04:00"), formatTime("05:00"), formatTime("06:00"),
  formatTime("07:00"), formatTime("08:00"), formatTime("09:00"),
  formatTime("10:00"), formatTime("11:00"), formatTime("12:00"),
  formatTime("13:00"), formatTime("14:00"), formatTime("15:00"),
  formatTime("16:00"), formatTime("17:00"), formatTime("18:00"),
  formatTime("19:00"), formatTime("20:00"), formatTime("21:00"),
  formatTime("22:00"), formatTime("23:00")]
////////////////////////////////////////////////////////////////////////////////
// DATA PARSING / PROCESSING VARS / SETUP
////////////////////////////////////////////////////////////////////////////////
var frisk_data,
  friskByTime;



var friskRowConverter = function(data) {
  return {
    date: parseDateTime(data.datestop),
    time: parseDateTime(data.timestop),
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
  // Draw MAP
  nycmap_svg.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke-width", 1.5)
    .attr("stroke", "white")
    .attr("fill", "#ccc");

  //////////////////////////////////////////////////////////////////////////////
  //Load in FRISK DATA
  //////////////////////////////////////////////////////////////////////////////
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
    console.log("frisk data");
    console.log(frisk_data);
    frisk_data = frisk_data.filter(function(d) {
      return (d.time != "" && d.time != null && !(isNaN(d.time)));
    });

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
      .attr("stroke-width", 0.15)
      .attr("fill", "rbga(0,0,0,0)");

    // LOAD INITIAL VIEW OF ALL CIRCLES
    initialView();
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

    //////////////////////////////
    // DATA MANIPULATION
    //////////////////////////////

    // GROUP BY TIME
    friskByTime = d3.nest()
      .key(function(d) {
        return formatTime(d3.timeHour.round(d.time));
      })
      .rollup(function(v) {
        return v.length
      })
      .entries(frisk_data);



    // SORT BY TIME
    friskByTime.sort(function(x, y) {
      return d3.ascending(x.key, y.key);
    });
    console.log("frisk by time");
    console.log(friskByTime);



    // //Discover start and end dates in dataset
    // var startTime = d3.min(friskByTime, function(d) {
    //   return parseTime(d.key);
    // });
    //
    //
    // var endTime = d3.max(friskByTime, function(d) {
    //   return parseTime(d.key);
    // });

    var startTime = d3.min(friskByTime, function(d) {
        return parseTime(d.key).getTime();
      }),
      endTime = d3.max(friskByTime, function(d) {
        return parseTime(d.key).getTime();
      }),
      padding_time = (endTime - startTime) * .035;


    xScale = d3.scaleTime()
      .domain([
        startTime, //startDate minus one day, for padding
        endTime + padding_time //endDate plus one day, for padding
      ])
      .rangeRound([padding_t, h_t - padding_t]);

    // Setting up scalers
    yScale = d3.scaleLinear()
      .domain([0, d3.max(friskByTime, function(d) {
        return d.value;
      })])
      .rangeRound([padding_t, w_t - 2 * padding_t])


    //Define axes
    xAxis = d3.axisBottom()
      .scale(yScale)
      .ticks(10);

    //Define Y axis
    yAxis = d3.axisLeft()
      .scale(xScale)
      .ticks(24)
      .tickFormat(reformatTime);


    timeline_svg.selectAll(".bar")
      .data(friskByTime)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) {
        return padding_t;

      })
      .attr("y", function(d) {
        return xScale(parseTime(d.key));
      })
      .attr("width", function(d) {
        return yScale(d.value) - padding_t;
      })
      .attr("height", function(d) {
        return ((h_t / 24) - 6);
      });


    // text label for the x axis
    timeline_svg.append("text")
      .attr("transform",
        "translate(" + (w_t / 2) + " ," +
        (h_t - (padding_t / 2)) + ")")
      .style("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-family", "Helvetica Neue")
      .attr("font-weight", "bold")
      .text("# Stopped");

    // text label for the y axis
    timeline_svg.append("text")
      // .attr("transform", "rotate(-90)")
      .attr("y", (.8 * padding_t))
      .attr("x", (padding_t / 2))
      .style("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-family", "Helvetica Neue")
      .attr("font-weight", "bold")
      .text("Time");

    //Create axes
    timeline_svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (h_t - padding_t) + ")")
      .call(xAxis);

    timeline_svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + padding_t + ",0)")
      .call(yAxis);



    // ////////////////////////////////////////////////////////////////////
      //   // Brush functions
      //   ////////////////////////////////////////////////////////////////////


    var brush = d3.brushY(xScale)
      .on("brush end", highlightBrushedCircles);



    var g = timeline_svg.append("g")
      .attr("height", 10)
      // .attr("width", 10)
      .attr("transform", "translate(" + padding_t + "," + padding_t + ")");


    var gBrush = g.append("g")
      .attr("class", "brush")
      .call(brush);

    gBrush.call(brush.move, [xScale(parseTime("20:00:00")), xScale(parseTime("23:59:00"))]);







    function highlightBrushedCircles() {
      // revert circles to initial style
      nycmap_svg.selectAll("circle").classed("brushed", false);
      nycmap_svg.selectAll("circle").attr("class", "nonbrushed");


      var maxTime = xScale.invert(d3.event.selection[1]);
      var minTime = xScale.invert(d3.event.selection[0]);


      // style brushed circles
      nycmap_svg.selectAll("circle").filter(function(d) {
        var currTime = d.time;
        return isBrushed(parseDate(minTime), parseDate(maxTime), currTime);
      })
        .classed("brushed", true);
    }




    function isBrushed(firstTime, lastTime, currentTime) {
      console.log(firstTime);
      console.log(currentTime);
      console.log(lastTime);

      if ((d3.max([firstTime, currentTime]) === currentTime)
        && (d3.min([lastTime, currentTime]) === currentTime)) {
        return true;
      } else {
        return false;
      }
    }



  //////////////////////////////////////////////////////////////////////
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
          showWhite = true;
        }
        break;
      case 'blackButton':
        if (showBlack) {
          showBlack = false;
        } else {
          showBlack = true;
        }
        break;
      case 'asianButton':
        if (showAsian) {
          showAsian = false;
        } else {
          showAsian = true;
        }
        break;
      case 'nativeButton':
        if (showNative) {
          showNative = false;
        } else {
          showNative = true;
        }
        break;
      case 'hispanicButton':
        if (showHispanic) {
          showHispanic = false;
        } else {
          showHispanic = true;
        }
        break;
      case 'otherButton':
        if (showOther) {
          showOther = false;
        } else {
          showOther = true;
        }
        break;
      case 'allButton':
        var showButton = window.parent.document.getElementById('allButton');
        if (showAll) {
          showButton.innerHTML = 'Show All';
          showAll = false;
          showHispanic = false;
          showBlack = false;
          showWhite = false;
          showAsian = false;
          showNative = false;
          setOtherButtons(false);
        } else {
          showButton.innerHTML = 'Reset';
          showAll = true;
          setOtherButtons(true);
        }
        break;
      default:
        console.log('NONE');
    }
    // END SWITCH STATEMENT
    update_circles_color();

  });
  // END OF ON CLICK


var initialView = function() {
  var showButton = window.parent.document.getElementById('allButton');
  showButton.innerHTML = 'Reset';
  var directions = window.parent.document.getElementById('buttonDirections');
  directions.innerHTML = 'Currently showing all races. Click Reset to begin.';
  showAll = true;
  setOtherButtons(true);
  update_circles_color();
}
var setOtherButtons = function(disabled) {
  $('#hispanicButton').prop('disabled', disabled);
  $('#otherButton').prop('disabled', disabled);
  $('#whiteButton').prop('disabled', disabled);
  $('#blackButton').prop('disabled', disabled);
  $('#asianButton').prop('disabled', disabled);
  $('#nativeButton').prop('disabled', disabled);
}



// UPDATE circles
var update_circles_color = function() {

  d3.selectAll("#nyc_map circle")
    .attr("stroke", function(d) {
      if ((showAll || showBlack) && (d.race == "B")) {
        // BLACK
        return "#000000"
      } else if ((showAll || showWhite) && (d.race == "W")) {
        // WHITE
        return "#000000"
      } else if ((showAll || showAsian) && (d.race == "A")) {
        // ASIAN
        return "#000000"
      } else if ((showAll || showNative) && (d.race == "I")) {
        // NATIVE AMERICAN
        return "#000000"
      } else if ((showAll || showHispanic) && (d.race == "P" || d.race == "Q")) {
        // HISPANIC
        return "#000000"
      } else if ((showAll || showOther) && (d.race == "X" || d.race == "Z")) {
        // UNKNOWN/OTHER
        return "#000000"
      } else {
        return "rgba(0,0,0,0)"
      }
    })
    .attr("fill", function(d, i) {
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
      } else if ((showAll || showOther) && (d.race == "X" || d.race == "Z")) {
        // HISPANIC
        return "#000000"
      } else {
        return "rgba(0,0,0,0)"
      }
    });





}
