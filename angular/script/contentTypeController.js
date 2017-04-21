app.controller('contentTypeController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
    $('ul.tabs').tabs();
    //variables
    $scope.spaces = spac;
    $scope.names = [];
    $scope.totalContentTypes = 0;
    $scope.srcSpace;
    $scope.destSpace;

    //functions

    $scope.getAllContentTypes = function (space, skipValue) {

        space.getContentTypes({
                skip: skipValue,
                order: "sys.createdAt"
            })
            .then((contentTypes) => {
                $scope.totalContentTypes = contentTypes.total;
                $scope.names = $scope.names.concat(contentTypes.items);
                if ($scope.names.length < $scope.totalContentTypes) {
                    skipValue = skipValue + 100;
                    $scope.getAllContentTypes(space, skipValue);
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
                $scope.srcSpace = space;
                // Now that we have a space, we can get assets from that space
                $scope.names = [];
                $scope.totalContentTypes = 0;
                var skipValue = 0;

                $scope.getAllContentTypes(space, skipValue);
            });
    }
    // end of changedvalue 

    // select all
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
        $('#searchContentType').keyup(function () {
            var matches = $('ul#sourceContentType').find('li:contains(' + $(this).val() + ') ');
            $('li', 'ul#sourceContentType').not(matches).slideUp();
            matches.slideDown();
        });
    });

    //Migrate Button Click - Migrate content types from source to Destination
    $scope.migratecontent = function () {

        $scope.tags = [];
        var destspace = $scope.selectedDest;
        var sourcespace = $scope.selectedSource;

        $scope.destClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: destspace.token,
            rateLimit: 3,
            maxRetries: 3
        });

        $scope.srcClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: sourcespace.token,
            rateLimit: 3,
            maxRetries: 3
        });

        $scope.destClient.getSpace(destspace.value)
            .then((space) => {
                $scope.destSpace = space;
                //loop for traversing selected items 
                var interval = 0;
                angular.forEach($scope.names, function (ctype) {
                    if (ctype.selected == true) {
                        ctype.status = "Started";
                        $timeout(function () {
                            createContentType(ctype);
                        }, interval);
                        interval = interval + 1000;
                    }
                }); //end of migrate function
            });
    };

    function createContentType(ctype) {

        var contenTypeID = ctype.sys.id;
        var fieldData = {};
        var data;
        $scope.destSpace.getContentType(contenTypeID)
            .then((contentType) => {
                console.log("Content type exists")
                ctype.status = "Exists - Updating";
                $scope.$apply();
                //get field object and name of src content type

                data = ctype.fields;
                contentType.fields = ctype.fields;
                contentType.name = ctype.name;
                contentType.description = ctype.description;
                contentType.displayField = ctype.displayField;
                contentType.update()
                    .then((updatedCT) => {
                        updatedCT.publish()
                            .then((publishedCT) => {
                                var srcEditorIFControls;
                                ctype.getEditorInterface()
                                    .then((editorIF) => {
                                        //console.log(editorIF);
                                        srcEditorIFControls = editorIF.controls;
                                        publishedCT.getEditorInterface()
                                            .then((destEditorIF) => {
                                                //console.log(destEditorIF);
                                                destEditorIF.controls = srcEditorIFControls;
                                                destEditorIF.update()
                                                    .then((updatedEditor) => {
                                                        ctype.status = "Published";
                                                        $scope.$apply();
                                                    })
                                            })
                                    })
                            })
                    })
            })
            .catch((contentTypeNotFound) => {
                console.log("content type not found")
                //get field object and name of 
                $scope.srcSpace.getContentType(contenTypeID)
                    .then((contentType) => {
                        console.log("source content data");
                        data = contentType.fields;
                        fieldData.fields = data;
                        fieldData.name = contentType.name;
                        fieldData.description = contentType.description;
                        fieldData.displayField = contentType.displayField;
                        var srcEditorIFControls;
                        contentType.getEditorInterface()
                            .then((editorIF) => {
                                //console.log(editorIF);
                                srcEditorIFControls = editorIF.controls;
                            })
                        $scope.destSpace.createContentTypeWithId(contenTypeID, fieldData)
                            .then((ct) => {
                                ct.publish()
                                    .then((pct) => {
                                        pct.getEditorInterface()
                                            .then((destEditorIF) => {
                                                //console.log(destEditorIF);
                                                destEditorIF.controls = srcEditorIFControls;
                                                destEditorIF.update()
                                                    .then((updatedEditor) => {
                                                        //***** The following commented code also works fine; it just makes a fresh request for content type

                                                        // $scope.destSpace.getContentType(updatedEditor.sys.contentType.sys.id).
                                                        // then((returnedContentType) => {
                                                        //     if (returnedContentType.isUpdated() || returnedContentType.isDraft()) {
                                                        //         //skip 
                                                        //     } else {
                                                        //         for (var x in $scope.names) {
                                                        //             if ($scope.names[x].sys.id === returnedContentType.sys.id) {
                                                        //                 $scope.names[x].status = "Published";
                                                        //             }
                                                        //             $scope.$apply();
                                                        //         }
                                                        //     }
                                                        // })
                                                        ctype.status = "Published";
                                                        $scope.$apply();
                                                    })
                                            })
                                    })
                                    .catch((err) => {
                                        //catch if there is any publishing error 
                                        var e = JSON.parse(err.message);
                                        console.log(e.status + ':' + e.statusText);
                                        ct.status = e.status + ':' + e.statusText;
                                        $scope.$apply();
                                    });

                            })
                    })
            })
    }

}]);