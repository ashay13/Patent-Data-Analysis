angular.module('PatentDataAnaysis')
    .directive('selectedDropdown',function($state){
        return{
            restrict: 'EA',
            link: function(scope,elem, attrs){
                elem.on('click',function(){
                    elem.next().slideToggle();

                    if(elem.find('i.right').text() === 'add') {
                        elem.find('i.right').text('remove');
                    } else if(elem.find('i.right').text() === 'remove'){
                        elem.find('i.right').text('add');
                    }
                });
            }
        }
});