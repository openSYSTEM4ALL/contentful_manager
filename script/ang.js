var app = angular.module('myApp', ['ngRoute']);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $routeProvider.when("/message/:id", {
        controller: "singleTopicViewController",
        templateUrl: "/templates/singleTopicView.html"
    });
    $routeProvider.when("/newMessage", {
        controller: "newMessageController",
        templateUrl: "/templates/newTopicView.html"
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