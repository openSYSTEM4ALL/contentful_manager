var app = angular.module('myApp', ['ngRoute']);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $routeProvider.when("/migrate-content-types", {
        controller: "contentTypeController",
        templateUrl: "js/angular/templates/content-types-migration.html"
    });
    $routeProvider.when("/migrate-entries", {
        controller: "entriesController",
        templateUrl: "js/angular/templates/entries-migration.html"
    });
    $routeProvider.when("/migrate-entries-locale", {
        controller: "entriesLocaleController",
        templateUrl: "js/angular/templates/entries-locale-migration.html"
    });
    $routeProvider.when("/migrate", {
        controller: "layoutController",
        templateUrl: "js/angular/templates/migrate.html"
    });
    $routeProvider.when("/login", {
        controller: "loginController",
        templateUrl:"js/angular/templates/login.html"
    });
    $routeProvider.when("/configure", {
        controller: "layoutController",
        templateUrl: "js/angular/templates/configure.html"
    });
    $routeProvider.when("/upload", {
        controller: "uploadController",
        templateUrl: "js/angular/templates/upload.html"
    });
    $routeProvider.when("/bulkupload", {
        controller: "bulkController",
        templateUrl:"js/angular/templates/bulkupload.html"
    });
    $routeProvider.when("/", {
        controller: "landingController",
        templateUrl:"js/angular/templates/landing.html"
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











