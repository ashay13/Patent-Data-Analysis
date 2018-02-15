(function () {
    'use strict';

    angular.module('PatentDataAnaysis').factory('PatentDAService', ['$http', '$q', 'MainConstant', PatentDAService]);

    /**
     * @class PatentDAService
     * @classdesc Service for the application
    */
    function PatentDAService($http, $q, MainConstant) {

        // get country and organization list
        function getSidebarData() {
            var countryReqObj = $http({
                method: 'GET',
                url: '/api/aggregations/by_countries'
            });
            
            var sectorReqObj = $http({
                method: 'GET',
                url:'/api/getSectorData'
            });
           
            var orgReqObj = $http({
                method: 'GET',
                url: '/api/aggregations/by_organizations'
            });

            return $q.all([countryReqObj,sectorReqObj,orgReqObj]);
        }

        // function returns map data for states of country
        function getLeafletMapData(countryList, fromDate, toDate) {
            var request = $http({
                method: 'GET',
                url: '/api/getCountriesMapData',
                params: {
                    countryList: countryList,
                    fromDate: fromDate,
                    toDate: toDate
                }
            });
            return request.then(function (response) {
                return response;
            });
        }

        function getStackedBarData(orgList, fromDate, toDate) {
            var request = $http({
                method: 'GET',
                url: '/api/getStackBarChartData',
                params: {
                    orgList: orgList,
                    fromDate: fromDate,
                    toDate: toDate
                }
            });
            return request.then(function (response) {
                return response;
            });
        }

        function getPiechartData(abbr) {
            var request = $http({
                method: 'GET',
                url: '/api/aggregations/by_states',
                params: {
                    country: abbr
                }
            });
            return request.then(function (response) {
                return response;
            });
        }

        function getLinechartData() {
            var request = $http({
                method: 'GET',
                url:'/api/getLineChartData'
            });
            return request.then(function (response) {
                return response;
            });
        }

        function getQuarterlyData(selectedYear) {
            var request = $http({
                method: 'GET',
                url:'/api/getLineChartDataQuarterly',
                params: {
                    selectedYear: selectedYear
                }
            });
            return request.then(function (response) {
                return response;
            });            
        }

        function getCirclePackingData(){
            var request = $http({
                method: 'GET',
                url:'/api/getCirclePackingData'
            });
            return request.then(function (response) {
                return response;
            });

        }

        return {
            getSidebarData: getSidebarData,
            getLeafletMapData: getLeafletMapData,
            getStackedBarData: getStackedBarData,
            getPiechartData: getPiechartData,
            getLinechartData: getLinechartData,
            getQuarterlyData: getQuarterlyData,
            getCirclePackingData: getCirclePackingData
        }
    }
})();