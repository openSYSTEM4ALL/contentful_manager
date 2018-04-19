app.controller('entriesLocaleController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
    $('ul.tabs').tabs();

    $scope.$on('$viewContentLoaded', function () {
        //call it here
        $scope.reRender();
    });
    $scope.reRender = function () {
        $('select').material_select();
    }

    angular.isUndefinedOrNullOrEmpty = function (val) {
        return angular.isUndefined(val) || val === null || val === '';
    };

    //variables
    $scope.spaces = spac;
    $scope.srcContentTypes = [];
    $scope.names = [];
    $scope.namesT = [];
    $scope.defaultDestLocale = null;
    $scope.destLocales = [];
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
        space.getEntries({
                content_type: selectedContentTypeId,
                skip: skipValue,
                order: "sys.createdAt"
            })
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

    $('.modal').modal({
        dismissible: false, // Modal can be dismissed by clicking outside of the modal
        opacity: .5, // Opacity of modal background
        inDuration: 300, // Transition in duration
        outDuration: 200, // Transition out duration
        startingTop: '4%', // Starting top style attribute
        endingTop: '10%', // Ending top style attribute
        ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
          console.log(modal, trigger);
        },
        complete: function() { 
         } // Callback for Modal close
      }
    );

    $('#ddlAssetLocale').on('change', function (e) {
        if ($('#ddlAssetLocale').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.selectedLocale = ($('#ddlAssetLocale').siblings('.dropdown-content').find('li.active>span').text());
            $scope.$apply();
        }
    });

    $("input[name='rbgroupLocale']").on('change', function (e) {
        if ($scope.localeToUpload == "DefaultLocale") {
            if (angular.isUndefinedOrNullOrEmpty($scope.defaultDestLocale)) {
                $scope.findDefaultLocale();
            }
            $scope.selectedLocale = $scope.defaultDestLocale;
        } else if ($scope.localeToUpload == "OtherLocale") {
            $scope.selectedLocale = null;
            $scope.reRender();
        }
        $scope.$apply();
    });

    $scope.getDestLocales = function (destSpaceSelected) {

        $scope.destitem = $filter('filter')($scope.spaces, {
            space: destSpaceSelected.space
        }, true)[0];
        $scope.destSpaceId = $scope.destitem.value;
        $scope.destAccessToken = $scope.destitem.token;
        $scope.destClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: $scope.destAccessToken,
            rateLimit: 3,
            maxRetries: 3
        });

        $scope.destClient.getSpace($scope.destSpaceId)
            .then((space) => {
                // Now that we have a space, we can get locales from that space
                $scope.destSpace = space;
                space.getLocales()
                    .then((locales) => {
                        $scope.destLocales = locales.items;
                        $scope.$apply();
                        $scope.reRender();
                    })
            });
    }

    $scope.findDefaultLocale = function () {
        var defaultFound = false;
        angular.forEach($scope.destLocales, function (destLocale) {
            if (!defaultFound) {
                if (destLocale.default == true) {
                    $scope.defaultDestLocale = destLocale.code;
                    defaultFound = true;
                }
            }
        });
    }

    $scope.checkLocale = function () {
        if (angular.isUndefinedOrNullOrEmpty($scope.selectedLocale)) {
            return true;
        } else {
            return false;
        }
    }

    $scope.checkDest = function () {
        if (angular.isUndefinedOrNullOrEmpty($scope.destSpace)) {
            return true;
        } else {
            return false;
        }
    }

    $scope.toggleAll = function () {
        if ($scope.selectedAll) {
            $scope.selectedAll = true;
        } else {
            $scope.selectedAll = false;
        }
        angular.forEach($scope.names, function (x) {
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
        var locale = $scope.selectedLocale;
        var contenTypeID = x.sys.contentType.sys.id;
        if ($scope.selectedContentTypeId != contenTypeID) {
            return null;
            console.log("Content Type mismatch error!")
        }
        var ctFields = $scope.selectedContentType.fields;
        var entryid = x.sys.id;
        var fields = x.fields;
        var fieldobj = {
            fields: {

            }
        };

        space.getEntry(entryid)
            .then(entry => {
                console.log(entry);
                var fieldsPresent = Object.keys(x.fields);
                for (var k = 0; k < ctFields.length; k++) {
                    var fieldId = ctFields[k].id;                                       
                    if (fieldsPresent.indexOf(fieldId) > -1) {
                        var localesPresent = Object.keys(x.fields[fieldId]);
                        if (localesPresent.indexOf(locale) > -1) {
                            if(Object.keys(entry.fields).indexOf(fieldId) > -1) {
                                entry.fields[fieldId][locale] = x.fields[fieldId][locale];
                            }
                            else {
                                entry.fields[fieldId] = {};
                                entry.fields[fieldId][locale] = x.fields[fieldId][locale];
                            }                            
                        }
                    }
                }
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
                for (var k = 0; k < ctFields.length; k++) {
                    var fieldId = ctFields[k].id;
                    fieldobj.fields[fieldId] = {};
                    var fieldsPresent = Object.keys(x.fields);                    
                    if (fieldsPresent.indexOf(fieldId) > -1) {
                        var localesPresent = Object.keys(x.fields[fieldId]);
                        if (localesPresent.indexOf(locale) > -1) {
                            fieldobj.fields[fieldId][locale] = x.fields[fieldId][locale];
                        }
                    }
                }
                space.createEntryWithId(contenTypeID, entryid, fieldobj)
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

     $scope.closeModal = function () {
        $('#confirmModal').modal('close');
    }
}]);