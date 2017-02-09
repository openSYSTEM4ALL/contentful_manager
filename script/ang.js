var app = angular.module('myApp', ['ngRoute']);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $routeProvider.when("/migrate-entries", {
        controller: "entriesController",
        templateUrl: "templates/entries-migration.html"
    });
    $routeProvider.when("/migrate", {
        controller: "layoutController",
        templateUrl: "templates/migrate.html"
    });
    $routeProvider.when("/login", {
        controller: "loginController",
        templateUrl:"templates/login.html"
    });
    $routeProvider.when("/configure", {
        controller: "layoutController",
        templateUrl: "templates/configure.html"
    });
    $routeProvider.when("/upload", {
        controller: "uploadController",
        templateUrl: "templates/upload.html"
    });
    $routeProvider.when("/bulkupload", {
        controller: "bulkController",
        templateUrl:"templates/bulkupload.html"
    });
    $routeProvider.when("/", {
        controller: "landingController",
        templateUrl:"templates/landing.html"
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











