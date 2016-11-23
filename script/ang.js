var app = angular.module('myApp', ['ngRoute']);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    
    $routeProvider.when("/migrate", {
        controller: "layoutController",
        templateUrl: "/templates/migrate.html"
    });
    $routeProvider.when("/", {
        controller: "landingController",
        templateUrl:"/templates/landing.html"
    });

    $routeProvider.otherwise({
        redirectTo: '/'
    });
    //if (window.history && window.history.pushState) {
   
    //    $locationProvider.html5Mode({
    //        enabled: true,
    //        requireBase: false
    //    });
    //}
}]);

app.controller('landingController', ["$scope", "$http",  function ($scope, $http) {
 $('.parallax').parallax();
 
}]);











