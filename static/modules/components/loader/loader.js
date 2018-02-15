angular.module('PatentDataAnaysis')
    .directive('loaderContainer', function ($state) {
        return {
            restrict: 'EA',
            templateUrl: "/static/modules/components/loader/loader.html",
            scope: {
                display: '=display'
            },
            link: function (scope, elem, attrs) {
                scope.$watch('display', function() {
                    if(arguments[0]) {
                        scope.showLoaderContent = true;
                    } else {
                        scope.showLoaderContent = false;
                    }
                })
            }
        }
    });