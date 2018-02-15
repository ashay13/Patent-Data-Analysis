(function () {
    'use strict';

    angular.module('PatentDataAnaysis').controller('MainController', ['$scope', '$timeout', 'PatentDAService', '$state', '$filter', MainController]);

    /**
     * @class MainController
     * @classdesc Controller for main/landing view
    */
    function MainController($scope, $timeout, PatentDAService, $state, $filter) {
        var mainCtrl = this;

        /*
         * Function toggle's the date-picker container
         */
        mainCtrl.showDatePickerContainer = function showDatePickerContainer() {
            $('.date-picker-container').slideToggle();
        };

        /*
         * Function gets the date-range values, selected countries and selected org's, and broadcast's this data to child(for performing respective API calls)
         */
        mainCtrl.getDaterangeData = function getDaterangeData() {
            if (new Date(mainCtrl.fromDate) >= new Date(mainCtrl.toDate)) {
                Materialize.toast('Enter valid date range', 4000);
            } else {
                var countryList = [],
                    orgList = [],
                    dateRangeObj;
                if (mainCtrl.orgSelcted) {
                    for (var keys in mainCtrl.orgSelcted) {
                        if (mainCtrl.orgSelcted[keys]) {
                            orgList.push(keys);
                        }
                    }
                }

                if (mainCtrl.countrySelected) {
                    for (var keys in mainCtrl.countrySelected) {
                        if (mainCtrl.countrySelected[keys]) {
                            countryList.push(keys);
                        }
                    }
                }

                dateRangeObj = {
                    countryList: countryList,
                    orgList: orgList,
                    fromDate: mainCtrl.fromDate,
                    toDate: mainCtrl.toDate
                }
            }

            $scope.$broadcast('Get:Daterange:Data', { data: dateRangeObj });
        };

        /*
         * Function gets the initial data(for sidebar and chart's) when the controller is initialized
         */
        mainCtrl.getInitialData = function getInitialData() {
            mainCtrl.showLoader = true;
            PatentDAService.getSidebarData().then(function (resp) {
                var statsData = [];

                mainCtrl.countryList = resp[0].data.aggregations;
                mainCtrl.sectorList = resp[1].data.sector_cnt.buckets;
                mainCtrl.organizationList = resp[2].data.aggregations;
                mainCtrl.showLoader = false;

                statsData.push({
                    totalPatent: resp[0].data.total,
                    country: resp[0].data.aggregations[0],
                    sector: resp[1].data.sector_cnt.buckets[0],
                    org: resp[2].data.aggregations[0]
                })

                $scope.$broadcast('Set:Statistics:Data', { data: statsData });
                $scope.$broadcast('Get:Charts:Data', { data: true });
            }, function (err) {
                mainCtrl.showLoader = false;
                Materialize.toast(err.statusText, 4000);
                $scope.$broadcast('Get:Charts:Data', { data: true });
            });
        };

        /*
         * Function initializesthe required parameters and calls the respective function to make API calls
         */
        function initApplication() {
            $('.button1-collapse').sideNav();
            $('.opt-container').niceScroll({ cursorwidth: '8px', zindex: 999, cursorborder: 'none', cursorcolor: '#eee' });
            $('.tooltipped').tooltip({ delay: 20 });
            mainCtrl.fromDate = mainCtrl.fromDate || $filter('date')(new Date('2013-01-01'), 'yyyy-MM-dd');
            mainCtrl.toDate = mainCtrl.toDate || $filter('date')(new Date('2016-12-01'), 'yyyy-MM-dd');
            mainCtrl.minFromDate = $filter('date')(new Date('2013-01-01'), 'yyyy-MM-dd');
            mainCtrl.getInitialData();
        }
        initApplication();

        /*
         * Events handles the display of loader on the page
         */
        $scope.$on('PDA:Show:Loader', function (event, data) {
            if (data.show) {
                mainCtrl.showLoader = true;
            } else {
                mainCtrl.showLoader = false;
            }
        });
    }
})();