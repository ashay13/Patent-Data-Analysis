(function () {
    'use strict';

    angular.module('PatentDataAnaysis').controller('DashboardController', ['$scope', '$timeout', 'PatentDAService', '$state', 'MainConstant', DashboardController]);

    /**
     * @class DashboardController
     * @classdesc Controller for dashboard view
    */
    function DashboardController($scope, $timeout, PatentDAService, $state, MainConstant) {
        var dashboardCtrl = this,
            bar_ctx = null,
            bar_chart = null,
            line_ctx = null,
            line_chart = null;

        /*
         * Event responsible for displaying statistics data(when app is initialized/refreshed)
         */
        $scope.$on('Set:Statistics:Data', function (event, data) {
            dashboardCtrl.totalPatents = data.data[0].totalPatent;
            dashboardCtrl.statsCountry = data.data[0].country;
            dashboardCtrl.statsSector = data.data[0].sector;
            dashboardCtrl.statsOrg = data.data[0].org;
        });

        /*
         * Function initializing the chart's data to be displayed, by calling respective functions
         */
        function getAllChartsData() {
            dashboardCtrl.getPatentDistributionMapData();
            dashboardCtrl.getKeywordAcrossCompanyData();
            dashboardCtrl.getTrendAnaysisData();
            dashboardCtrl.getTrendCirclepackingData();
        }

        /*
         * Event captures the date range, selected countries and selected org's, and displayed the various chart's accordingly
         */
        $scope.$on('Get:Daterange:Data', function (event, data) {
            dashboardCtrl.getKeywordAcrossCompanyData(data.data.orgList, data.data.fromDate, data.data.toDate);
            dashboardCtrl.getPatentDistributionMapData(data.data.countryList, data.data.fromDate, data.data.toDate);
        })

        /*
         * Function displays leaflet/world map data for selecetd/all countries
         */
        dashboardCtrl.getPatentDistributionMapData = function getPatentDistributionMapData(countryList, fromDate, toDate) {
            var countrylist = [];
            dashboardCtrl.showLeafletLoader = true;
            dashboardCtrl.showLeafletError = true;
            if(countryList && countryList.length > 0) {
                countrylist = countryList;                
            } else {
                angular.forEach($scope.$parent.mainCtrl.countryList, function(val, ind) {
                    if(val.abbr) {
                        countrylist.push(val.abbr);
                    } else {
                        countrylist.push(val.key);
                    }                    
                });
            }

            PatentDAService.getLeafletMapData(countrylist, fromDate, toDate).then(function (resp) {
                dashboardCtrl.leafletData = resp.data;
                dashboardCtrl.showLeafletLoader = false;
                dashboardCtrl.showLeafletError = false;
                $scope.$emit('PDA:Show:Loader', { show: false });
            }, function (err) {
                dashboardCtrl.showLeafletError = true;
                dashboardCtrl.showLeafletLoader = false;
                $scope.$emit('PDA:Show:Loader', { show: false });
            });
        }

        /*
         * Function displays sector distribution data across selected/default organizations
         */
        dashboardCtrl.getKeywordAcrossCompanyData = function getKeywordAcrossCompanyData(orgList, fromDate, toDate) {
            if (orgList && orgList.length > 0) {
                dashboardCtrl.showtopStackedLabel = false;
            } else {
                dashboardCtrl.showtopStackedLabel = true;
            }
            dashboardCtrl.showStackedbarLoader = true;
            dashboardCtrl.showStackedbarError = false;
            PatentDAService.getStackedBarData(orgList, fromDate, toDate).then(function (resp) {
                createStackedBarchart(resp.data.orgs.buckets);
                dashboardCtrl.showStackedbarLoader = false;
            }, function (err) {
                dashboardCtrl.showStackedbarError = true;
                Materialize.toast(err.statusText, 4000);
                dashboardCtrl.showStackedbarLoader = false;
            });
        };


        /*
         * Function displays trend analysis data(for keywords)
         */
        dashboardCtrl.getTrendAnaysisData = function getTrendAnaysisData() {
            dashboardCtrl.shwoLinechartLoader = true;
            dashboardCtrl.showLinechartError = false;
            PatentDAService.getLinechartData().then(function (resp) {
                createLineChart(resp.data);
                dashboardCtrl.shwoLinechartLoader = false;
                dashboardCtrl.showLinechartError = false;
            }, function (err) {
                dashboardCtrl.shwoLinechartLoader = false;
                dashboardCtrl.showLinechartError = true;
            });
        };

        dashboardCtrl.getTrendCirclepackingData = function getTrendCirclepackingData() {
            dashboardCtrl.shwoCirclePackingLoader = true;
            dashboardCtrl.shwoCirclePackingError = false;
            PatentDAService.getCirclePackingData().then(function (resp) {
                dashboardCtrl.nodes = resp.data;
                dashboardCtrl.shwoCirclePackingLoader = false;
                dashboardCtrl.shwoCirclePackingError = false;
            }, function (err) {
                dashboardCtrl.shwoCirclePackingLoader = false;
                dashboardCtrl.shwoCirclePackingError = true;
            });
        };


        /*
        * Function responsible for creating stackedbar chart
        */
        function createStackedBarchart(chartData) {
            var getUniqueCountries,
                labelArr = [],
                dataSet = [],
                allCompanies = [],
                dataArr1 = [],
                dataArr2 = [],
                dataArr3 = [],
                dataArr4 = [],
                dataArr5 = [];

            if (bar_chart && bar_chart !== null) {
                bar_chart.destroy();
            }

            var numberWithCommas = function (x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            };

            // return an array of unique companies
            var getUniqueCompanyList = function (allKeys) {
                var result = [];
                angular.forEach(allKeys, function (val) {
                    if ($.inArray(val, result) === -1) result.push(val);
                });
                return result;
            };

            // gets an array of all the companies
            angular.forEach(chartData, function (val, ind) {
                angular.forEach(val.sector.buckets, function (v, i) {
                    allCompanies.push(v.key);
                });
            });

            getUniqueCountries = getUniqueCompanyList(allCompanies);

            // create the dataset/data-array for each keyowrd/sector
            angular.forEach(chartData, function (val, ind) {
                angular.forEach(val.sector.buckets, function (v, i) {
                    for (var j = 0; j < getUniqueCountries.length; j++) {
                        if (v.key === getUniqueCountries[j]) {
                            eval('dataArr' + (ind + 1)).splice(j, 0, v.doc_count);
                        }
                    }
                });
            });

            // set the dataset array values for the respective keywords
            for (var i = 0; i < chartData.length; i++) {
                dataSet.push({
                    label: chartData[i].key,
                    data: eval('dataArr' + (i + 1)),
                    backgroundColor: (function () {
                        if (i == 0) {
                            return "#01579b"
                        } else if (i == 1) {
                            return "#00bcd4"
                        } else if (i == 2) {
                            return "#37474f"
                        } else if (i == 3) {
                            return "#7cb342"
                        } else if (i == 4) {
                            return "#ce93d8"
                        }
                    })(i),
                    hoverBackgroundColor: (function () {
                        if (i == 0) {
                            return "#01579b"
                        } else if (i == 1) {
                            return "#00bcd4"
                        } else if (i == 2) {
                            return "#37474f"
                        } else if (i == 3) {
                            return "#7cb342"
                        } else if (i == 4) {
                            return "#ce93d8"
                        }
                    })(i)
                })
            }

            bar_ctx = $("#stackedbar-chart")[0];
            bar_chart = new Chart(bar_ctx, {
                type: 'bar',
                animation: {
                    animateScale: true
                },
                data: {
                    labels: getUniqueCountries,
                    datasets: dataSet
                },
                options: {
                    tooltips: {
                        mode: 'label',
                        callbacks: {
                            label: function (tooltipItem, data) {
                                return data.datasets[tooltipItem.datasetIndex].label + ": " + numberWithCommas(tooltipItem.yLabel);
                            }
                        }
                    },
                    scales: {
                        xAxes: [{
                            stacked: true,
                            gridLines: { display: false },
                            scaleLabel: {
                                display: true,
                                labelString: 'Organization'
                            }
                        }],
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                callback: function (value) { return numberWithCommas(value); }
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Patent Count'
                            }
                        }],
                    },
                    legend: { display: true }
                }
            });
        }


        /*
        * Function responsible for creating line chart(Trend Analysis)
        */
        function createLineChart(lineData, labelArray) {
            var labelArr = [],
                dataSet = [],
                chartData,
                chart_ins;

            if (line_chart && line_chart !== null) {
                line_chart.destroy();
            }

            if (!labelArray) {
                for (var keys in lineData[0][1]) {
                    labelArr.push(keys);
                }
            } else {
                labelArr = labelArray;
            }

            var getRandomColor = function () {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            };

            angular.forEach(lineData, function (val, ind) {
                var data = [];

                for (var keys in val[1]) {
                    data.push(Math.round(val[1][keys] * 100) / 100)
                }
                dataSet.push({
                    label: val[0],
                    // lineTension: 0,
                    borderColor: getRandomColor(),
                    backgroundColor: "transparent",
                    pointBorderWidth: 1,
                    data: data
                })
            });

            chartData = {
                labels: labelArr,
                datasets: dataSet
            }

            line_ctx = $("#line-chart")[0];
            chart_ins = line_chart = new Chart(line_ctx, {
                type: 'line',
                data: chartData,
                options: {
                    legend: {
                        display: false
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        /*
         * Function displaying quarterly data for trend anaysis
         */
        dashboardCtrl.getQuarterlyDataFor = function getQuarterlyDataFor(selectedYear) {
            var setSelectedYear = selectedYear ? selectedYear : dashboardCtrl.selectYearQuarter;
            dashboardCtrl.shwoLinechartLoader = true;
            dashboardCtrl.showLinechartError = false;
            PatentDAService.getQuarterlyData(setSelectedYear).then(function (resp) {
                dashboardCtrl.shwoLinechartLoader = false;
                dashboardCtrl.showLinechartError = false;
                createLineChart(resp.data, MainConstant.LINECHART_QUARTERLY_LABELS);
            }, function (err) {
                dashboardCtrl.shwoLinechartLoader = false;
                dashboardCtrl.showLinechartError = true;
            });
        };

        $scope.$on('Set:Quarterly:Data:Selected', function(event, data) {
            dashboardCtrl.showStat = false;
            dashboardCtrl.showSelectedYear = false;
            var selectedYear, max;

            if(data.data.depth === 0) {
                dashboardCtrl.getTrendAnaysisData();
            } else if(data.data.depth === 1) {
                dashboardCtrl.showSelectedYear = true;
                selectedYear = data.data.name.split(':');
                dashboardCtrl.getQuarterlyDataFor(selectedYear[1].trim());
                dashboardCtrl.selectedCircleYear = selectedYear[1].trim();
            } else if(data.data.depth === 2) {
                console.log("data" , data.data);
                dashboardCtrl.showSelectedYear = true;
                selectedYear = data.data.parent.name.split(':');
                dashboardCtrl.getQuarterlyDataFor(selectedYear[1].trim());
                dashboardCtrl.selectedCircleYear = selectedYear[1].trim();

                max = null;
                dashboardCtrl.showStat = true;
                dashboardCtrl.selectedRangeData = data.data;
                dashboardCtrl.valueData = data.data.children[data.data.children.length-1];
                $scope.$apply();
            }
        });

        /*
         * Event displaying the initial/default chart data, when the application is initialized/refreshed
         */
        $scope.$on('Get:Charts:Data', function (event, data) {
            $scope.$emit('PDA:Show:Loader', { show: true });
            getAllChartsData();
        });
    }
})();