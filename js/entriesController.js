app.controller('entriesController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
    $('ul.tabs').tabs();

    $scope.$on('$viewContentLoaded', function () {
        //call it here
        $scope.reRender();
    });
    $scope.reRender = function () {
        $('select').material_select();
    }

    //variables
    $scope.spaces = spac;
    $scope.srcContentTypes = [];
    $scope.names = [];
    $scope.namesT = [];
    $scope.totalEntries = 0;
    $scope.showActivity = true;

    //functions
    $scope.getAllContentTypes = function (space, skipValue) {
        
                space.getContentTypes({
                        skip: skipValue,
                        order: "sys.createdAt"
                    })
                    .then((contentTypes) => {
                        $scope.totalContentTypes = contentTypes.total;
                        $scope.srcContentTypes = $scope.srcContentTypes.concat(contentTypes.items);
                        if ($scope.srcContentTypes.length < $scope.totalContentTypes) {
                            skipValue = skipValue + 100;
                            $scope.getAllContentTypes(space, skipValue);
                        }
                        var optionAll = {
                            description : "Select All",
                            displayField : "All Content Types",
                            name : "All Content Types",
                            sys : {
                                    id: "All" 
                            }
                        }
                        $scope.srcContentTypes.push(optionAll);  
                        $scope.$apply();
                    }).catch((err) => {
                        var e = JSON.parse(err.message);
                        console.log(e.status + ':' + e.statusText);
                    })
            }
        
            $scope.fetchContentTypes = function (srcitem) {
        
                $scope.srcClient = contentfulManagement.createClient({
                    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
                    accessToken: srcitem.token
                });
                $scope.srcClient.getSpace(srcitem.value)
                    .then((space) => {
                        $scope.srcSpace = space;
                        // Now that we have a space, we can get assets from that space
                        $scope.srcContentTypes = [];
                        console.log($scope.srcContentTypes.length);
                        $scope.totalContentTypes = 0;
                        var skipValue = 0;
        
                        $scope.getAllContentTypes(space, skipValue);
                        $scope.reRender();
                        $scope.$apply();
                    });
            }

    $scope.getAllEntries = function (space, selectedContentTypeId, skipValue) {

        var parameters = {
            skip: skipValue,
            order: "sys.createdAt"
        };

        if(selectedContentTypeId != "All") {
            parameters["content_type"] = selectedContentTypeId;
        }

        space.getEntries(parameters
            )
            .then((assets) => {
                $scope.totalEntries = assets.total;
                $scope.namesT = $scope.namesT.concat(assets.items);
                $scope.names = [];
                angular.forEach($scope.namesT, function (entry) {
                    if (entry.isUpdated() || entry.isDraft() || entry.isArchived()) {
                        // do nothing just skip   
                    } else {
                        $scope.names.push(entry);
                    }
                });
                if ($scope.namesT.length < $scope.totalEntries) {
                    skipValue = skipValue + 100;
                    $scope.getAllEntries(space, selectedContentTypeId, skipValue);
                }
                //$scope.countSourceAssets();
                $scope.$apply();
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            })
    }


    $scope.changedValue = function (selectedContentType) {

        // Now that we have a space, we can get assets from that space
        $scope.names = [];
        $scope.namesT = [];
        $scope.selectedAll = false;
        $scope.totalEntries = 0;
        var skipValue = 0;

        if (selectedContentType != null) {
            $scope.selectedContentTypeId = selectedContentType.sys.id
            $scope.getAllEntries($scope.srcSpace, $scope.selectedContentTypeId, skipValue);
        }
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
            accessToken: space.token,
            rateLimit: 3,
            maxRetries: 3
        });

        $scope.srcClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: sourcespace.token,
            rateLimit: 3,
            maxRetries: 3
        });

        $scope.destClient.getSpace(space.value)
            .then((space) => {
                //loop for traversing selected items 
                var interval = 0;
                angular.forEach($scope.names, function (x) {
                    if (x.selected == true) {
                        x.status = "Started";
                        $timeout(function () {
                            createContentType(space, sourcespace, x);
                        }, interval);
                        interval = interval + 1000;
                    }
                }); //end of migrate function
            });
    };

    function createContentType(space, sourcespace, x) {

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
                                fieldData.displayField = contentType.displayField;
                                var srcEditorIFControls;
                                contentType.getEditorInterface()
                                    .then((editorIF) => {
                                        console.log(editorIF);
                                        srcEditorIFControls = editorIF.controls;
                                    })
                                space.createContentTypeWithId(contenTypeID, fieldData)
                                    .then((ct) => {
                                        ct.publish()
                                            .then((pct) => {
                                                pct.getEditorInterface()
                                                    .then((destEditorIF) => {
                                                        console.log(destEditorIF);
                                                        destEditorIF.controls = srcEditorIFControls;
                                                        destEditorIF.update()
                                                            .then((updatedContentType) => {
                                                                migrateEntry(space, x);
                                                            })
                                                    })

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