
//a self-executing anonymous function to move leaflet map to local scope
(function(){

//declare map var in global scope
var map; //Background map
var mapSymbols; // Proportional Symbols
var LegendControl; // Legend
var dataStats = {min:21, max:51, mean:30}; //manually created values for the total combined numbers
var centerPoint = [38, -87];
var zoomLevel = 4;

//Declare Database global variables
var dataSelected = ["all-casualties"]

// creates map and calls data
function createMap(){
    //create the map
    myBounds = new L.LatLngBounds(new L.LatLng(60, 0), new L.LatLng(30, 0));

    map = L.map('mapCanvas', {
        zoomControl: false,
        center: centerPoint,
        zoom: zoomLevel,
        minZoom: 3,
        maxZoom: 12,
        maxBounds: [[75, -180], [-30, 180]], // [top, left], [bottom, right]
        attributionControl: false
    });

    //Add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/outdoors-v11',
        zoomOffset: -1,
        tileSize: 512,
        accessToken: 'pk.eyJ1IjoibWFyay13b2p0YSIsImEiOiJja2R1cDFqODcwMW90MnRxNTUycDl2azQyIn0.SfngBeDYSXdejPNUNPUMXQ'
    }).addTo(map);

    // Add zoom control (but in top right)
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    //adds Data
    getData(map);
};

//Import GeoJSON data depending on what info is clicked, select the correct data
function getData(map){
    // Combined Databases
    if (dataSelected[0] === "all-casualties") {
        //load the data
        $.getJSON("data/casualties.geojson", function(response){
            //create an attributes array
            var attributes = processData(response, "all"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "all");
            createLegend(attributes[0], "all");
        });
    } else if (dataSelected[0] === "union-casualties") {
        //load the data
        $.getJSON("data/union.geojson", function(response){
            //create an attributes array
            var attributes = processData(response, "union"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "union");
            createLegend(attributes[0], "union");
        });
    } else if (dataSelected[0] === "confederate-casualties") {
        //load the data
        $.getJSON("data/confederate.geojson", function(response){
            //create an attributes array
            var attributes = processData(response, "confederate"); // attributes = Total Number

            // calcStats(response, "combined");
            createPropSymbols(response, attributes, "confederate");
            createLegend(attributes[0], "confederate");
        });
    }
};

//Build an attributes array from the special data
function processData(data, keyword){
    //empty array to hold attributes
    var attributes = [];
    //empty variable to store properties
    var currentProperties;

    //properties of the first feature in the dataset
    if (keyword === "all") {
        //assign current json to global variable for filtering
        currentDB = data;

        //properties of the first feature in the dataset
        currentProperties = data.features[0].properties;

        //push each attribute name into attributes array
        for (var attribute in currentProperties){
            //only take attributes with keyword values
            if (attribute.indexOf("totalCasualties") > -1){
                attributes.push(attribute);
            };
        };
    } else if (keyword === "union") {
        //assign current json to global variable for filtering
        currentDB = data;

        //properties of the first feature in the dataset
        currentProperties = data.features[0].properties;

        //push each attribute name into attributes array
        for (var attribute in currentProperties){
            //only take attributes with keyword values
            if (attribute.indexOf("unionCasualties") > -1){
                attributes.push(attribute);
            };
        };
    } else if (keyword === "confederate") {
        //assign current json to global variable for filtering
        currentDB = data;

        //properties of the first feature in the dataset
        currentProperties = data.features[0].properties;

        //push each attribute name into attributes array
        for (var attribute in currentProperties){
            //only take attributes with keyword values
            if (attribute.indexOf("confederateCasualties") > -1){
                attributes.push(attribute);
            };
        };
    }
    return attributes;
};

// Add circle markers for point features to the map
function createPropSymbols(data, attributes, keyword){

    //create a Leaflet GeoJSON layer and add it to the map
    mapSymbols = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes, keyword);
        }
    }).addTo(map);
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes, keyword){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    if (keyword == "all"){
        // create hover label content
        var hoverLabel = feature.properties.battle

        //create marker options
        var options = {
            fillColor: "#78BFA5",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };

        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties[attribute]);

        //Create the popup content for the combined dataset layer
        var popupContent = createPopup(feature.properties, attribute);
    } else if (keyword == "union"){
        // create hover label content
        var hoverLabel = feature.properties.battle

        //create marker options
        var options = {
            fillColor: "#66A3D9",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };
        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties[attribute]);

        var popupContent = createPopup(feature.properties, keyword);
    } else if (keyword == "confederate"){
        // create hover label content
        var hoverLabel = feature.properties.battle

        //create marker options
        var options = {
            fillColor: "#66A3D9",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.8
        };
        //For each feature, determine its value for the selected attribute
        var attValue = Number(feature.properties[attribute]);

        var popupContent = createPopup(feature.properties, keyword);
    }

    //Give each feature's circle marker a radius based on its attribute value
    if (attValue > 0) {
        options.radius = calcPropRadius(attValue, keyword);
    } else if (attValue == 0) {
        var options = {
            radius: 0,
            fillColor: "#ffffff",
            color: "#000",
            weight: 1,
            opacity: 0,
            fillOpacity: 0,
            // display: none
        };
    }

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //bind the popup to the circle marker if its a city
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,(-options.radius)/2)
    }).bindTooltip(hoverLabel, {direction: "center", offset: [0,10],permanent: false, sticky: true, opacity: 0.9, className: "poly-labels"}  //then add your options
    );

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue, keyword) {
      if (keyword === "all"){
          // Picked values that look normal
          var minValue = 1000;
          //constant factor adjusts symbol sizes evenly
          var minRadius = 1.5;
      } else if (keyword === "union") {
          // Picked values that look normal
          var minValue = 1000;
          //constant factor adjusts symbol sizes evenly
          var minRadius = 1.5;
      } else if (keyword === "confederate") {
          // Picked values that look normal
          var minValue = 1000;
          //constant factor adjusts symbol sizes evenly
          var minRadius = 1.5;
      }
      //Flannery Appearance Compensation formula
      var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;

      return radius;
};

// Creates text for the popups in the prop symbols
function createPopup(properties, attributes, keyword){
    //ADD OTHER DATA TO MAP!!!!!!!!
    //ADD TIME SLIDER FOR YEARS OF BATTLES?
    //added Metropolitan Stastical Area
    if (dataSelected[0] === "all-casualties") {
        var popupContent = "<p><b>" + properties.battle + "</b></p>";
        //add city to popup content string
        popupContent += "<p>Winner of Battle: <b>" + properties.winner + "</b></p>";
        //add length of battle to panel content string
        popupContent += "<p>Length of Battle: <b>" + properties.date + "</b></p>";
        //add formatted attribute to panel content string
        var year = attributes;
        popupContent += "<p>Battle's Total Casualties: <b>" + properties[attributes] + " personnel</b></p>";
        //added states containing MSA
        popupContent += "<p>State Location of Battle: <b>" + properties.location + "</b></p>";
    } else if (dataSelected[0] === "union-casualties") {
        var popupContent = "<p><b>" + properties.battle + "</b></p>";
        //add city to popup content string
        popupContent += "<p>Winner of Battle: <b>" + properties.winner + "</b></p>";
        //add length of battle to panel content string
        popupContent += "<p>Length of Battle: <b>" + properties.date + "</b></p>";
        //add formatted attribute to panel content string
        var year = attributes;
        popupContent += "<p>Battle's Total Casualties: <b>" + properties[attributes] + " personnel</b></p>";
        //added states containing MSA
        popupContent += "<p>State Location of Battle: <b>" + properties.location + "</b></p>";
    } else if (dataSelected[0] === "confederate-casualties") {
        var popupContent = "<p><b>" + properties.battle + "</b></p>";
        //add city to popup content string
        popupContent += "<p>Winner of Battle: <b>" + properties.winner + "</b></p>";
        //add length of battle to panel content string
        popupContent += "<p>Length of Battle: <b>" + properties.date + "</b></p>";
        //add formatted attribute to panel content string
        var year = attributes;
        popupContent += "<p>Battle's Total Casualties: <b>" + properties[attributes] + " personnel</b></p>";
        //added states containing MSA
        popupContent += "<p>State Location of Battle: <b>" + properties.location + "</b></p>";
    }

    return popupContent;
};

//creates legend
function createLegend(attibute, keyword){
    LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            if (keyword === "all") {
                dataStats = {min:19455, max:51112, mean:27829};
                //add temporal legend div to container
                $(container).append('<h3 id="legend-title" <b>All Casualties</b> </h3>');
                //array of circle names to base loop on
                var circles = ["max", "mean", "min"];
                //start attribute legend svg string
                var svg = '<svg id="attribute-legend" width="240px" height="170px" margin="center">';

                //Loop to add each circle and text to svg string
                for (var i=0; i<circles.length; i++){
                    //Assign the r and cy attributes
                    var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                    var cy = (180 - radius) -130;

                    //circle string
                    svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="58"/>';

                    //evenly space out labels
                    if (i < 1) {
                      var textY = 20; //spacing + y value
                    } else if (i == 1) {
                      var textY = 40; //spacing + y value
                    } else if (i == 2) {
                      var textY = 60; //spacing + y value
                    }

                    //text string
                    svg += '<text id="' + circles[i] + '-text" x="130" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " casualties" + '</text>';
                };
                //close svg string
                svg += "</svg>";

            } else if (keyword === "union") {
                dataStats = {min:2832, max:23049, mean:13485};
                //add temporal legend div to container
                $(container).append('<h3 id="legend-title" <b>Union Casualties</b> </h3>');
                //array of circle names to base loop on
                var circles = ["max", "mean", "min"];
                //start attribute legend svg string
                var svg = '<svg id="attribute-legend" width="190px" height="170px" margin="center">';

                //Loop to add each circle and text to svg string
                for (var i=0; i<circles.length; i++){
                    //Assign the r and cy attributes
                    var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                    var cy = (180 - radius) -130;

                    //circle string
                    svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="58"/>';

                    //evenly space out labels
                    if (i < 1) {
                      var textY = 20; //spacing + y value
                    } else if (i == 1) {
                      var textY = 40; //spacing + y value
                    } else if (i == 2) {
                      var textY = 60; //spacing + y value
                    }

                    //text string
                    svg += '<text id="' + circles[i] + '-text" x="130" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " casualties" + '</text>';
                };
                //close svg string
                svg += "</svg>";
            } else if (keyword === "confederate") {
                dataStats = {min:7750, max:28063, mean:12842};
                //add temporal legend div to container
                $(container).append('<h3 id="legend-title" <b>Confederate Casualties</b> </h3>');
                //array of circle names to base loop on
                var circles = ["max", "mean", "min"];
                //start attribute legend svg string
                var svg = '<svg id="attribute-legend" width="190px" height="170px" margin="center">';

                //Loop to add each circle and text to svg string
                for (var i=0; i<circles.length; i++){
                    //Assign the r and cy attributes
                    var radius = calcPropRadius(dataStats[circles[i]], keyword); //Manually set radius of circles
                    var cy = (180 - radius) -130;

                    //circle string
                    svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#78BFA5" fill-opacity="1" stroke="#000000" cx="58"/>';

                    //evenly space out labels
                    if (i < 1) {
                      var textY = 20; //spacing + y value
                    } else if (i == 1) {
                      var textY = 40; //spacing + y value
                    } else if (i == 2) {
                      var textY = 60; //spacing + y value
                    }

                    //text string
                    svg += '<text id="' + circles[i] + '-text" x="130" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " casualties" + '</text>';
                };
                //close svg string
                svg += "</svg>";
            }

            //add attribute legend svg to container
            $(container).append(svg);

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    map.addControl(new LegendControl());
};

//Clear the map and recreate it
function resetMap(){
/*    $("#loadingScreen").css("display", "block");
    $("#spinner").css("display", "block");
*/

    // Remove the Pop symbol layer and the legend
    map.removeLayer(mapSymbols);
    $(".secondary").css("display", "none");
    $(".legend-control-container").remove();

    getData(map);

/*
    setTimeout(function() { // allow spinner to load before work starts
        $("#spinner").css("display", "none");
        $("#loadingScreen").css("display", "none");
    },1500);
*/

}

// Retrieve which database is selected and update advance filter labels and map
function getDatabase(){
    dataSelected[0] = document.querySelector('.database-check:checked').value;
    var container = L.DomUtil.get('map');

    if (dataSelected[0] === "all-casualties") {
        resetMap();

    } else if (dataSelected[0] === "union-casualties") {
        resetMap();

    } else if (dataSelected[0] === "confederate-casualties") {
        resetMap();
    }
}

// Database event listener
document.querySelectorAll(".database-check").forEach( input => input.addEventListener('click', getDatabase) );

//Create Map
$(document).ready(createMap());

})(); //last line of map js
