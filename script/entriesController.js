app.controller('entriesController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
    $('ul.tabs').tabs();
    //variables
    $scope.spaces = spac;
    $scope.names = [];
    $scope.totalEntries = 0;


    //functions

    $scope.getAllEntries = function (space, skipValue) {
        space.getEntries({
                skip: skipValue,
                order: "sys.createdAt"
            })
            .then((assets) => {
                $scope.totalEntries = assets.total;
                $scope.names = $scope.names.concat(assets.items);
                if ($scope.names.length < $scope.totalEntries) {
                    skipValue = skipValue + 100;
                    $scope.getAllEntries(space, skipValue);
                }
                //$scope.countSourceAssets();
                $scope.$apply();
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            })
    }


    $scope.changedValue = function (srcitem) {


        $scope.srcClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: srcitem.token
        });
        $scope.srcClient.getSpace(srcitem.value)
            .then((space) => {
                // Now that we have a space, we can get assets from that space
                $scope.names = [];
                $scope.totalEntries = 0;
                var skipValue = 0;
                $scope.getAllEntries(space, skipValue);
            });
    } 
    // end of changedvalue 




}]);