angular.module('PatentDataAnaysis')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");
    $stateProvider
      .state('home', {
        url: "/home",
        templateUrl: "/static/views/main.html",
        controller: "MainController",
        controllerAs: "mainCtrl",
        redirectTo: "home.dashboard"
      })
      .state('home.dashboard', {
        url: "/dashboard",
        templateUrl: "/static/views/dashboard/dashboard.html",
        controller: "DashboardController",
        controllerAs: "dashboardCtrl",
      })
  })
  .run(['$rootScope', '$state', function ($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (toState.redirectTo) {
        event.preventDefault();
        $state.go(toState.redirectTo);
      }
    })
  }]);