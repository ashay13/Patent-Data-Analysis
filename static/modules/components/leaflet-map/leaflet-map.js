angular.module('PatentDataAnaysis')
    .directive('leafletMap', function ($state, $timeout, PatentDAService) {
        return {
            restrict: 'EA',
            templateUrl: "/static/modules/components/leaflet-map/leaflet-map.html",
            scope: {
                mapData: '=mapData'
            },
            link: function (scope, elem, attrs) {
                scope.showModal = false;
                var windowTop,
                    legend,
                    mapboxAccessToken = "pk.eyJ1IjoicmthbmdhbGUiLCJhIjoiY2l2OTN1cXR5MDAxYzJ0bnl3aDVnOGUyeiJ9.qYsdixfWlMMBNstiDP3VQg",
                    map = L.map('map').setView([10, 45], 2),
                    pie_ctx,
                    pie_chart;

                function sticky_set() {
                    windowTop = $(window).scrollTop();
                }

                $(function () {
                    $(window).scroll(sticky_set);
                    sticky_set();
                });

                scope.$watch('mapData', function () {
                    scope.mapData = arguments[0];
                    console.log("Changed:",arguments);
                    if (arguments[0]) {
                        scope.mapData = arguments[0];

                        L.geoJson(scope.mapData, {
                            style: style,
                        }).addTo(map)
                            .on('click', function (e) {
                                $('.modal-container').css('top', windowTop);
                                $('.modal-body').css('top', windowTop + 35);
                                scope.selectedFeature = e.layer.feature;
                                scope.showModal = true;
                                createStatewisePieChartData(e.layer.feature);
                                scope.$apply();
                            });
                    }
                });

                L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
                    maxZoom: 10,
                    id: 'mapbox.light',
                    attribution: ''
                }).addTo(map);

                // get color depending on population density value
                function getColor(d) {
                    return d > 1000 ? '#7DBCFF' :
                        d > 500 ? '#6F9C65' :
                            d > 200 ? '#4366B3' :
                                d > 100 ? '#2DFFC3' :
                                    d > 50 ? '#000' :
                                        d > 20 ? 'pink' :
                                            d > 10 ? 'orange' :
                                                '#FFEDA0';
                }

                function style(feature) {
                    return {
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7,
                        fillColor: getColor(feature.properties.density)
                    };
                }

                // create legend
                legend = L.control({ position: 'bottomright' });
                legend.onAdd = function (map) {
                    var div = L.DomUtil.create('div', 'info legend'),
                        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                        labels = [];
                    // loop through our density intervals and generate a label with a colored square for each interval
                    for (var i = 0; i < grades.length; i++) {
                        div.innerHTML +=
                            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
                    }
                    return div;
                };
                legend.addTo(map);


                function createStatewisePieChartData(countryData) {
                    scope.$emit('PDA:Show:Loader', { show: true });
                    PatentDAService.getPiechartData(countryData.properties.abbr).then(function (resp) {
                        createPieChart(resp.data.aggregations);
                        scope.$emit('PDA:Show:Loader', { show: false });
                    }, function (err) {
                        scope.$emit('PDA:Show:Loader', { show: false });
                        Materialize.toast(err.statusText, 4000);
                    })
                }

                function createPieChart(chartData) {
                    var chartDataArr = [],
                        labelArr = [];

                    if(pie_chart && pie_chart !== null) {
                        pie_chart.destroy();
                    }

                    scope.showingTotal = 0;

                    angular.forEach(chartData, function (val, ind) {
                        labelArr.push(val.key);
                        chartDataArr.push(val.doc_count);
                        scope.showingTotal = scope.showingTotal + val.doc_count;
                    });


                    var data = {
                        labels: labelArr,
                        datasets: [
                            {
                                data: chartDataArr,
                                backgroundColor: [
                                    "#b0bec5",
                                    "#80cbc4",
                                    "#FFCE56",
                                    "#b2ebf2",
                                    "#9575cd"
                                ],
                                hoverBackgroundColor: [
                                    "#b0bec5",
                                    "#80cbc4",
                                    "#FFCE56",
                                    "#b2ebf2",
                                    "#9575cd"
                                ]
                            }]
                    };

                    $("#pie-chart").remove();
                    $(".modal-pie").append('<canvas id="pie-chart" class="canvas-chart"></canvas>');


                    pie_ctx = $("#pie-chart")[0];
                    pie_chart = new Chart(pie_ctx, {
                        type: 'pie',
                        animation: {
                            animateScale: true
                        },
                        data: data,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    })
                }


                scope.closeModal = function closeModal() {
                    scope.showModal = false;
                };

                scope.$watch('showModal', function () {
                    if (arguments[0]) {
                        $('body').css('overflow', 'hidden');
                    } else {
                        $('body').css('overflow', 'auto');
                    }
                });


                scope.createModalChart = function createModalChart() {
                    var randomScalingFactor = function () {
                        return Math.round(Math.random() * 1000)
                    };
                    var chartDataArr = [],
                        labelArr = [];

                    var data = {
                        labels: ['A', 'B', 'C', 'D', 'E'],
                        datasets: [
                            {
                                label: "A",
                                lineTension: 0,
                                backgroundColor: "#59B1D6",
                                borderColor: "#59B1D6",
                                pointBorderColor: "#376E85",
                                pointBackgroundColor: "#376E85",
                                pointBorderWidth: 2,
                                data: [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor()]
                            }
                        ]
                    }

                    var canvas = $("#line-chart")[0];
                    var ctx = canvas.getContext("2d");

                    new Chart(ctx, {
                        type: 'line',
                        data: data,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    })
                };

            }
        }
    });