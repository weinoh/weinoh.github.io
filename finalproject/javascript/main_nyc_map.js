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
var padding_t_top = 30;
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

////////////////////////////////////////////////////////////////////////////////
// DATA PARSING / PROCESSING VARS / SETUP
////////////////////////////////////////////////////////////////////////////////
// d3 functions for parsing dates and times
var formatTime = d3.timeFormat("%H:%M");
var parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var parseTime = d3.timeParse("%H:%M");
var reformatTime = d3.timeFormat("%I:%M %p");
// variables for frisk data
var frisk_data,
  frisk_data_black,
  frisk_data_white,
  frisk_data_asian,
  frisk_data_hispanic,
  frisk_data_native,
  frisk_data_other,
  friskTime_total,
  friskTime_black,
  friskTime_white,
  friskTime_asian,
  friskTime_hispanic,
  friskTime_native,
  friskTime_other;

var startTime,
  endTime,
  padding_time,
  brush;


// ALL RELEVANT VARIABLES HERE
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
  d3.csv("./csv/stop_frisk.csv", friskRowConverter, function(data) {
    // DATA LOAD / REMOVE BAD TIMES
    frisk_data = data
    frisk_data = frisk_data.filter(function(d) {
      return (d.time != "" && d.time != null && !(isNaN(d.time)));
    });



    //////////////////////////////////////////
    // Draw circles for first time for murders
    /////////////////////////////////////////
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
      .attr("r", 2)
      .attr("stroke", "black")
      .attr("stroke-width", 0.25)
      .attr("fill", "rbga(0,0,0,0)");

    // LOAD INITIAL VIEW OF ALL CIRCLES
    initialView();
    // END OF CIRCLE DRAWING


    // //////////////////////////////////////////////////////////////////////
    // // Graph for Brushing
    // //////////////////////////////////////////////////////////////////////

    //////////////////////////////
    // DATA MANIPULATION
    //////////////////////////////
    manipulateData();
    // Get axes and start/end times in order
    setUpTimeLine(friskTime_total);



    var chart = timeline_svg.append("g")
      .attr("id", "chartArea")
      .selectAll(".bar")
      .data(friskTime_total)
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
        (h_t - .1 * padding_t_top) + ")")
      .style("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-family", "Helvetica Neue")
      .attr("font-weight", "bold")
      .text("# Stopped");

    // text label for the y axis
    timeline_svg.append("text")
      // .attr("transform", "rotate(-90)")
      .attr("y", (.75 * padding_t_top))
      .attr("x", (padding_t / 2))
      .style("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-family", "Helvetica Neue")
      .attr("font-weight", "bold")
      .text("Time");

    //Create axes
    var x_axis_svg = timeline_svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (h_t - padding_t_top) + ")")
      .call(xAxis);

    var y_axis_svg = timeline_svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + padding_t + ",0)")
      .call(yAxis);



    //////////////////////////////////////////////////////////////////////
      //// Brush functions
      //////////////////////////////////////////////////////////////////////


    brush = d3.brushY(xScale)
      .extent([[padding_t, padding_t_top], [w_t - padding_t, h_t - padding_t_top]])
      .on("brush end", highlightBrushedCircles);



    var gBrush = d3.select("#chartArea")
      .append("g")
      .attr("class", "brush")
      .call(brush);

    gBrush.call(brush.move, [xScale(parseTime("15:00")), xScale(parseTime("19:00"))]);

    function highlightBrushedCircles() {
      // revert circles to initial style
      nycmap_svg.selectAll("circle").classed("brushed", false);
      nycmap_svg.selectAll("circle").attr("class", "nonbrushed");


      var maxTime = xScale.invert(d3.event.selection[1]);
      var minTime = xScale.invert(d3.event.selection[0]);


      // style brushed circles
      nycmap_svg.selectAll("circle").filter(function(d) {
        var currTime = d.time;
        return isBrushed(minTime, maxTime, currTime);
      })
        .classed("brushed", true);
    }

    function isBrushed(firstTime, lastTime, currentTime) {

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

function manipulateData() {
  // BLACK
  frisk_data_black = frisk_data.filter(function(d) {
    return (d.race == "B");
  });
  // WHITE
  frisk_data_white = frisk_data.filter(function(d) {
    return (d.race == "W");
  });
  // asian
  frisk_data_asian = frisk_data.filter(function(d) {
    return (d.race == "A");
  });
  // native
  frisk_data_native = frisk_data.filter(function(d) {
    return (d.race == "I");
  });
  // hispanic
  frisk_data_hispanic = frisk_data.filter(function(d) {
    return (d.race == "P" || d.race == "Q");
  });
  // other
  frisk_data_other = frisk_data.filter(function(d) {
    return (d.race == "X" || d.race == "Z");
  });

  // GROUP BY TIME
  friskTime_total = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data);

  // GROUP BY TIME
  friskTime_black = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_black);

  // GROUP BY TIME
  friskTime_white = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_white);

  // GROUP BY TIME
  friskTime_asian = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_asian);

  // GROUP BY TIME
  friskTime_hispanic = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_hispanic);

  // GROUP BY TIME
  friskTime_other = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_other);

  // GROUP BY TIME
  friskTime_native = d3.nest()
    .key(function(d) {
      return formatTime(d3.timeHour.round(d.time));
    })
    .rollup(function(v) {
      return v.length
    })
    .entries(frisk_data_native);

}

function setUpTimeLine(dataset) {
  startTime = d3.min(dataset, function(d) {
    return parseTime(d.key).getTime();
  });
  endTime = d3.max(dataset, function(d) {
    return parseTime(d.key).getTime();
  });
  padding_time = (endTime - startTime) * .035;


  xScale = d3.scaleTime()
    .domain([
      startTime, //startDate minus one day, for padding
      endTime + padding_time //endDate plus one day, for padding
    ])
    .rangeRound([padding_t_top, h_t - padding_t_top]);

  // Setting up scalers
  yScale = d3.scaleLinear()
    .domain([0, d3.max(dataset, function(d) {
      return d.value;
    })])
    .rangeRound([padding_t, w_t - padding_t])


  //Define axes
  xAxis = d3.axisBottom()
    .scale(yScale)
    .ticks(10);

  //Define Y axis
  yAxis = d3.axisLeft()
    .scale(xScale)
    .ticks(24)
    .tickFormat(reformatTime);

}

var toggleAnimation = function(d) {
  var ease = d3.easeLinear();
  var timeDiff = endTime - startTime;
  const iterations = 25;
  var adjustment = timeDiff / iterations;

  let nextTime = startTime + adjustment;
  d3.select("g .brush")
    .transition()
    .duration(500)
    .call(brush.move, [xScale(startTime), xScale(nextTime)]);

  for (let i = 1; i < iterations; i++) {
    let nextStartTime = startTime + (adjustment * i);
    let nextEndTime = nextStartTime + adjustment;
    d3.select("g .brush")
      .transition()
      .duration(750)
      .delay(750 * i)
      .call(brush.move, [xScale(nextStartTime), xScale(nextEndTime)]);
  }
}



////////////////////////////////////////////////////////////////////////////////
////// UPDATE FUNCTIONS
////////////////////////////////////////////////////////////////////////////////
d3.selectAll('#anim-btn')
  .on('click', function() {
    toggleAnimation()
  });



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
