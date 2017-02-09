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
    $scope.toggleAll = function () {
        if ($scope.selectedAll) {
            $scope.selectedAll = true;
        } else {
            $scope.selectedAll = false;
        }
        angular.forEach($scope.names, function (x) {
            console.log(x);
            x.selected = $scope.selectedAll;
        });
    };
    //unselect select all in case any item gets unchecked.
    $scope.toggleSelectAll = function () {
        var keepGoing = true;
        angular.forEach($scope.names, function (x) {
            if (keepGoing) {
                
                if (x.selected != true) {
                    $scope.selectedAll = false;
                    keepGoing = false;
                } else {
                    $scope.selectedAll = true;
                }
            }
        });

    }

    //search 
        $(function () {
        $('#searchAsset').keyup(function () {
            var matches = $('ul#sourceAssets').find('li:contains(' + $(this).val() + ') ');
            $('li', 'ul#sourceAssets').not(matches).slideUp();
            matches.slideDown();
        });
    });
    



}]);