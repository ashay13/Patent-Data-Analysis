angular.module('PatentDataAnaysis')
    .directive('datePicker', function ($state) {
        return {
            restrict: 'EA',
            scope: {
                ngModel: '=ngModel',
                min: '=min'
            },
            link: function (scope, elem, attrs) {
                var setDate, picker;

                picker = elem.pickadate({
                    selectMonths: true,
                    selectYears: 4,
                    format: 'yyyy-mm-dd',
                    min: scope.min,
                    today: scope.min
                });

                setDate = picker.pickadate('picker');
                setDate.set('select', scope.ngModel);
            }
        }
    });