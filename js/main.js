$(document).ready(function() {
        //set variables to create map
        var cities;
        var map = L.map('map', {
            //create center on point that shows all proportional symbols
            center: [36.879621, 30.719254],
            zoom: 2.3,
            //added minzoom to regular start point
            minzoom: 2.3,
            zoomcontrol: false
        });
        //add OpenStreetMap tilelayer
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(map);

        //function to getData and add to map using ajax for mastercardDestinations
        getData(map);

        function getData(map){
            //load the data
         $.ajax("/data/mastercardDestinations.geojson", {
                dataType: "json",
                success: function(response){
                    //create an attributes array
                    var info = processData(response);
                    createPropSymbols(info.timestamps, response);
                    createSliderUI(info.timestamps);
                    createLegend(info.min, info.max);
                }
            });
        };

        function processData(data) {
          var timestamps = [];
          var min = Infinity;
          var max = -Infinity;

          for (var feature in data.features) {


                  var properties = data.features[feature].properties;


                  for (var attribute in properties) {

                          if (attribute != 'city' &&
                            attribute != 'styleUrl' &&
                            attribute != 'styleHash' &&
                            attribute != 'Asia' &&
                            attribute != 'Europe' &&
                            attribute != 'Rest') {

                                  if ($.inArray(attribute, timestamps) === -1) {
                                        timestamps.push(attribute);
                                  }

                                  if (properties[attribute] < min) {
                                          min = properties[attribute];
                                  }

                                  if (properties[attribute] > max) {
                                          max = properties[attribute];
                                  }
                            }
                  }
          }
          return {
                  timestamps : timestamps,
                  min : min,
                  max : max
          }
        }

        function createPropSymbols(timestamps, data) {



                cities = L.geoJson(data, {

                        pointToLayer: function(feature, latlng) {

                        return L.circleMarker(latlng, {
                                fillColor: '#E6C07D',
                                color: '#997029',
                                weight: 1.5,
                                fillOpacity: 0.6
                        }).on({

                                mouseover: function(e) {
                                        this.openPopup();
                                        this.setStyle({color: '#225B99'});
                                },
                                mouseout: function(e) {
                                        this.closePopup();
                                        this.setStyle({color: '#997029'});
                                },
                                click: function(e) {
                                  if (map.getZoom() <4) {
                                    map.flyTo([e.latlng.lat, e.latlng.lng], 4)
                                }
                                  else if (map.getZoom() >=4 && map.getZoom() <7) {
                                    map.flyTo([e.latlng.lat, e.latlng.lng], 7)
                                  }
                                else
                                  map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom())
                                }
                        });
                        }
                }).addTo(map);

                updatePropSymbols(timestamps[0]);
        }

        function updatePropSymbols(timestamp) {

            cities.eachLayer(function(layer) {

                    var props = layer.feature.properties;
                    var radius = calcPropRadius(props[timestamp]);
                    var popupContent = "<b>" + String(props[timestamp]) +
                                    " million visitors</b><br>" +
                                    "<i>" + props.city +
                                    "</i> in </i>" +
                                    timestamp + "</i>";

                    layer.setRadius(radius);
                    layer.bindPopup(popupContent, { offset: new L.Point(0, -radius) });
            });
        }

        function calcPropRadius(attributeValue) {

                var scaleFactor = 40;
                var area = attributeValue * scaleFactor;
                return Math.sqrt(area/Math.PI)*2;
        }

        function createSliderUI(timestamps) {

                        var sliderControl = L.control({ position: 'bottomleft'} );

                        sliderControl.onAdd = function(map) {

                                var slider = L.DomUtil.create("input", "range-slider");
                                slider.id = "slider";

                                L.DomEvent.addListener(slider, 'mousedown', function(e) {
                                        L.DomEvent.stopPropagation(e);

                                L.DomEvent.off('click', onMapClick);
                                });

                                $(slider)
                                      .attr({'type':'range',
                                              'max': timestamps[timestamps.length-1],
                                              'min': timestamps[0],
                                              'step': 1,
                                              'value': String(timestamps[0])})
                                          .on('input change', function() {
                                            updatePropSymbols($(this).val().toString());
                                            updateData(this.value);
                                                  $(".temporal-legend").text(this.value);
                                          });
                                          return slider;
                        }

                        sliderControl.addTo(map)
                        createTemporalLegend(timestamps[0]);
        };

          function createTemporalLegend(startTimestamp)  {

            var temporalLegend = L.control({ position: 'bottomleft' });

            temporalLegend.onAdd = function(map) {
                    var output = L.DomUtil.create("output", "temporal-legend");
                    output.id = "timelegend";
                    $(output).text(startTimestamp)
                    return output;
            }

            temporalLegend.addTo(map);
          };
          //cant get this function to work as of 7/2
            /*function updateTemporalLegend(timestamp) {
            var updateTime = $('#timelegend');
            updateTime.remove();
            updateTime.text(String(timestamp));
            updateTime.addTo(map);
          };*/

          function createLegend(min, max) {

           var legend = L.control( { position: 'bottomright'} );

           legend.onAdd = function(map) {

             var legendContainer = L.DomUtil.create("div", "legend");
             var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
             var classes = [Math.round(min), Math.round((max-min)/2), Math.round(max)];
             var legendCircle;
             var lastRadius = 0;
             var currentRadius;
             var margin;

             L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
                    L.DomEvent.stopPropagation(e);
             });

             $(legendContainer).append("<h5 id='legendTitle'>International Visitors<br></br>(millions)</h5>");

             for (var i = 0; i <=classes.length-1; i++) {

                    legendCircle = L.DomUtil.create("div", "legendCircle");

                    currentRadius = calcPropRadius(classes[i]);

                    margin = -currentRadius - lastRadius - 2;

                    $(legendCircle).attr("style", "width: " + currentRadius*2 +
                            "px; height: " + currentRadius*2 +
                            "px; margin-left: " + margin + "px" );
                    $(legendCircle).append("<span class='legendValue'>"+classes[i]+"</span>");
                    $(symbolsContainer).append(legendCircle);

                    lastRadius = currentRadius;
             }

             $(legendContainer).append(symbolsContainer);

             return legendContainer;
           };
           legend.addTo(map);
         } //end createLegend();

         var popup = L.popup();

         function onMapClick(e) {
           popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(map);
              }

              //turn on map click for coordinates, currently off
              //map.on('click', onMapClick);

          //add scale to bottom left corner
          L.control.scale().addTo(map);

          //easy button that will be below zoom buttons and reset map view, svg size controlled with number after sharp/
          const easyButton = L.easyButton('<img src="https://img.icons8.com/material-sharp/18/000000/home-page.png"/>', function(){map.setView([36.879621, 30.719254], 2.3)}).addTo(map);
          //fix to center home icon inside of button
          easyButton.button.style.padding ='0px';


          //set variables to get elementID
          var yearButton = document.getElementById("yearButton");
          var years = document.getElementById("years");
          //on click of button --toggle the years below
          $(yearButton).click(function() {
            $(years).toggleClass('active')
          });

          //on click of years, updatePropSymbols, update Slider and append data to sidebar
          //currently coded the long way instead on one main function--consolidate later
          //currently no sidebar change
            var y2012 = document.getElementById("y2012");
            $(y2012).click(function() {
              $(years).toggleClass('active')
              updateData(2012);
              updatePropSymbols(2012);
              updateSlider("2012");
              updatePanel(2012);
            });

            var y2013 = document.getElementById("y2013");
            $(y2013).click(function() {
              $(years).toggleClass('active')
              updateData(2013);
              updatePropSymbols(2013);
              updateSlider("2013");
            });

            var y2014 = document.getElementById("y2014");
            $(y2014).click(function() {
              $(years).toggleClass('active')
              updateData(2014);
              updatePropSymbols(2014);
              updateSlider("2014");
            });

            var y2015 = document.getElementById("y2015");
            $(y2015).click(function() {
              $(years).toggleClass('active')
              updateData(2015);
              updatePropSymbols(2015);
              updateSlider("2015");
            });

            var y2016 = document.getElementById("y2016");
            $(y2016).click(function() {
              $(years).toggleClass('active')
              updateData(2016);
              updatePropSymbols(2016);
              updateSlider("2016");
            });

            var y2017 = document.getElementById("y2017");
            $(y2017).click(function() {
              $(years).toggleClass('active')
              updateData(2017);
              updatePropSymbols(2017);
              updateSlider("2017");
            });

            var y2018 = document.getElementById("y2018");
            $(y2018).click(function() {
              $(years).toggleClass('active')
              updateData(2018);
              updatePropSymbols(2018);
              updateSlider("2018");
            });

          //function to update the call slider move event with given timestamp
          function updateSlider(timestamp){
                  var newVal = timestamp;
                  var slider = $('#slider');
                  var s = $(slider);
                  $(slider).val(newVal)
                  $(slider).slider('refresh');
                };


          //function to process data and update on sidebar results
          function updateData(timestamp) {

            var removeData = document.getElementById("dataGroup").querySelectorAll(".topdata");
            $(removeData).remove();

            $('#currentyear').remove()

            var datarank = document.getElementById("dataGroup");
            var addYear = L.DomUtil.create("div", "currentyear");
            addYear.id = "currentyear";

            $(addYear).append("Top 20 Visited Cities in " + timestamp);
            $(datarank).append(addYear);

            cities.eachLayer(function(layer) {

            var props = layer.feature.properties;

            var dataSidebar = L.DomUtil.create("div", "topdata");

            /*--unable to sort data currently
            var res = [];
                for (var i in props) {
                  console.log(i)
                    res.push(props[i])
                  };
            console.log(res);


            newProps = res.sort(compareValues(timestamp, 'desc'));
            console.log(newProps); */

            //--$(dataSidebar).append("<b>" + props.city + ":</b>" + " " + String(props[timestamp]) + " million visitors");

              //$(dataSidebar).append("<b>" + props.city + ":</b>" + " " + "no data for selected year");

            $(dataSidebar).append("<b>" + props.city + ":</b>" + " " + String(props[timestamp]) + " million visitors");


            $(datarank).append(dataSidebar);


            $(datarank).children().each(function() {
              $(this).html( $(this).html().replace(/undefined million visitors/g, "Not a top destination in " + timestamp) );
            });

            return dataSidebar
          });


        };
        /*--attempt to sort data failed, saving function for later--
        function compareValues(key, order = 'asc') {
          return function innerSort(a,b) {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
              //property doesn't exist on either object
              return 0;
            }

            const varA = (typeof a[key] === 'string')
              ? a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string')
              ? b[key].toUpperCase() : b[key];

              let comparison = 0;
              if (varA > varB) {
                comparison = 1;
              } else if (varA < varB) {
                comparison = -1;
              }
              return (
                (order === 'desc') ? (comparison * -1) : comparison
              );
          };
        };*/
});
