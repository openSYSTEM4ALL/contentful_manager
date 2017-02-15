app.controller('entriesController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
    $('ul.tabs').tabs();
    //variables
    $scope.spaces = spac;
    $scope.names = [];
    $scope.totalEntries = 0;
    $scope.showActivity = true;

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
    //Migrate Button Click - Migrate entries from source to Destination
    $scope.migratecontent = function () {


        $scope.tags = [];
        $scope.publishedAsset = [];
        $scope.resultSet = [];
        var space = $scope.selectedDest;
        var sourcespace = $scope.selectedSource;

        $scope.destClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: space.token
        });

        $scope.srcClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: sourcespace.token
        });

        $scope.destClient.getSpace(space.value)
            .then((space) => {
                //loop for traversing selected items 
                var interval = 0;
                angular.forEach($scope.names, function (x) {
                    if (x.selected == true) {
                        x.status = "Started";
                        $timeout(function () {
                            createContentType(space,sourcespace, x);  
                        }, interval);
                        interval = interval + 1000;
                    }
                }); //end of migrate function
            });
    };
    function createContentType(space,sourcespace, x) {
       
        var contenTypeID = x.sys.contentType.sys.id;
        var fieldData = {};
        var data;
        space.getContentType(contenTypeID)
       .then(contenType => {
           console.log("Content type exists")
           migrateEntry(space, x);
                           })
            .catch((contentTypeNotFound) => {
                console.log("content type not found")
                //get field object and name of 
                $scope.srcClient.getSpace(sourcespace.value)
                            .then((srcspace) => {
                                srcspace.getContentType(contenTypeID)
                                    .then(contentType => {
                                        console.log("source content data");
                                       
                                        data = contentType.fields;
                                        fieldData.fields = data;
                                        fieldData.name = contentType.name;
                                        fieldData.displayField = contentType.displayField
                                        console.log(fieldData)
                                        space.createContentTypeWithId(contenTypeID, fieldData)
                                             .then((ct) => {
                                                 ct.publish()
                                                 .then((pct) => {
                                                     migrateEntry(space, x);
                                                 })
                                                 .catch((err) => {
                                                     //catch if there is any publishing error 
                                                     var e = JSON.parse(err.message);
                                                     console.log(e.status + ':' + e.statusText);
                                                     x.status = e.status + ':' + e.statusText;
                                                     $scope.$apply();
                                                 });
                 
                                        })
                                })
                  })
          })
    }
    function migrateEntry(space, x) {
        var contenTypeID = x.sys.contentType.sys.id;
        var entryid = x.sys.id;
        var fields = x.fields;
        var fieldobj = {};
        fieldobj.fields = fields;

        space.getEntry(entryid)
            .then(entry => {
                console.log(entry);
                entry.fields = fields;
                entry.update()
                    .then((updatedentry) => {
                        updatedentry.publish()
                            .then(uentry => {
                                console.log("updated entry version:" + uentry.sys.publishedVersion)
                                x.status = "Published";
                                $scope.$apply();
                            }).catch((err) => {
                                //catch if there is any publishing error 
                                var e = JSON.parse(err.message);
                                console.log(e.status + ':' + e.statusText);
                                x.status = e.status + ':' + e.statusText;
                                $scope.$apply();
                            });

                    }).catch((err) => {
                        //catch if there is any error in update
                        var e = JSON.parse(err.message);
                        console.log(e.status + ':' + e.statusText);
                        x.status = e.status + ':' + e.statusText;
                        $scope.$apply();
                    });

            }).catch((notfoundentry) => {
                
                space.createEntryWithId(contenTypeID, entryid,
                        fieldobj)
                    .then(newentry => {
                        newentry.publish()
                            .then(entry => {
                                console.log("new entry version" + entry.sys.publishedVersion)
                                x.status = "Published";
                                $scope.$apply();
                            })
                            .catch((err) => {
                                //catch if theres any error in publishing a new entry 
                                var e = JSON.parse(err.message);
                                console.log(e.status + ':' + e.statusText);
                                x.status = e.status + ':' + e.statusText;
                                $scope.$apply();
                            });
                    })
                    .catch((err) => {
                        //catch if theres any error in creating a new entry 
                        var e = JSON.parse(err.message);
                        console.log(e.status + ':' + e.statusText);
                        x.status = e.status + ':' + e.statusText;
                        $scope.$apply();
                    });
            })
    }

    $scope.migrateContentRecursive = function () {

        if ($scope.selectedDest.token.length > 0) {
            $scope.srcClient = contentfulManagement.createClient({
                accessToken: $scope.selectedDest.token
            });
            $scope.srcClient.getSpace(space.value)
                .then((space) => {
                    migrateEntriesRecur(space, 0);
                });

        } else {
            Materialize.toast('Please check for valid destination space or valid token!', 4000);
        }
    };

    function migrateEntriesRecur(space, i) {
        if (i > $scope.names.length) {
            return; // do nothing
        } else {
            if ($scope.names[i].selected == true) {
                space.getEntry(entryid)
                    .then(entry => {
                        console.log(entry);
                        entry.fields = fields;
                        entry.update()
                            .then((updatedentry) => updatedentry.publish()
                                .then(uentry => console.log("updated entry version:" + uentry.sys.publishedVersion)))
                        migrateEntriesRecur(space, i++);
                    }).catch((notfoundentry) => {
                        space.createEntryWithId(contenTypeID, entryid,
                                fieldobj)
                            .then(newentry => newentry.publish()
                                .then(entry => console.log("new entry version" + entry.sys.publishedVersion))
                            )
                        migrateEntriesRecur(space, i++);
                    });
            } // end if
            else {
                migrateEntriesRecur(space, i++);
            }

        } // end else
    }
}]);