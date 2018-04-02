app.controller('uploadController', ['$scope', '$http', '$timeout', '$window', '$filter', function ($scope, $http, $timeout, $window, $filter) {
    $('ul.tabs').tabs();

    angular.isUndefinedOrNullOrEmpty = function (val) {
        return angular.isUndefined(val) || val === null || val === '';
    };

    $scope.$on('$viewContentLoaded', function () {
        //call it here
        $scope.reRender();
    });
    $scope.reRender = function () {
        $('select').material_select();
    }

    $scope.updateTextFields = function updateTextFields() {
        Materialize.updateTextFields();
      };

    $scope.defaultDestLocale = null;
    $scope.spaces = spac;
    $scope.destLocales = [];
    $scope.assetList = [];
    $scope.successfulAssets = [];
    $scope.resultSet = [];
    $scope.showActivity = true;
    $scope.displayTypeOptions = {
        option1: "Will show activity from start till the end for each asset",
        option2: "Will show only those assets which are published successfully"
    };

    
    $('#ddlDestSpace').on('change', function (e) {
        if ($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.getDestLocales($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text());
        }
    });
    $('#ddlAssetLocale').on('change', function (e) {
        if ($('#ddlAssetLocale').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.selectedLocale = ($('#ddlAssetLocale').siblings('.dropdown-content').find('li.active>span').text());
            $scope.setLocaleForEachAsset();
            $scope.$apply();
        }
    });
    $('#ddlContentType').on('change', function (e) {
        if ($('#ddlContentType').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.assetContentType = ($('#ddlContentType').siblings('.dropdown-content').find('li.active>span').text());
        }
    });
    $("input[name='rbgroupLocale']").on('change', function (e) {
        if ($scope.localeToUpload == "DefaultLocale") {
            if (angular.isUndefinedOrNullOrEmpty($scope.defaultDestLocale)) {
                $scope.findDefaultLocale();
            }
            $scope.selectedLocale = $scope.defaultDestLocale;
            $scope.setLocaleForEachAsset();
        } 
        else if ($scope.localeToUpload == "OtherLocale") {
                $scope.selectedLocale = null;
                $scope.reRender();                
        }
        $scope.$apply();
    });

    $scope.getDestLocales = function (destSpaceSelected) {

        $scope.destitem = $filter('filter')($scope.spaces, {
            space: destSpaceSelected
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

    $scope.setLocaleForEachAsset = function () {
        if ($scope.assetList.length > 0) {
            for (var a in $scope.assetList) {
                $scope.assetList[a].locale = $scope.selectedLocale;
            }
        }
    }

    $scope.saveAssetToList = function () {

        if (btnAdd.value == "Update") {
            for (var a in $scope.assetList) {
                if ($scope.assetList[a].assetName == $scope.assetName) {

                    $scope.assetList[a].assetTitle = $scope.assetTitle;
                    $scope.assetList[a].assetContentType = $scope.assetContentType;
                    $scope.assetList[a].assetUrl = $scope.assetUrl;
                    $scope.assetList[a].locale = $scope.selectedLocale;
                    txtAssetName.readOnly = false;
                    Materialize.toast('Congrats! Your operation was successfull', 3000);
                }
            }
            btnAdd.value = "Add";
        } else if (btnAdd.value == "Add") {

            var duplicate = false;
            for (var a in $scope.assetList) {
                if ($scope.assetList[a].assetName.toLowerCase() == $scope.assetName.toLowerCase()) {
                    Materialize.toast('Asset Name already present in  list', 3000);
                    duplicate = true;
                    break;
                }
            }
            if (!duplicate) {
                var currentAsset = {
                    assetName: $scope.assetName,
                    assetTitle: $scope.assetTitle,
                    assetContentType: $scope.assetContentType,
                    assetUrl: $scope.assetUrl,
                    locale: $scope.selectedLocale
                }
                $scope.assetList.push(currentAsset);
                Materialize.toast('Congrats! Your operation was successfull', 3000);
            }
        }

        $scope.assetName = "";
        $scope.assetTitle = "";
        $scope.assetContentType = "";
        $scope.assetUrl = "";
        //$scope.selectedLocale = "";  //Not working for select
    }

    $scope.editAssetInList = function (name, title, contentType, locale, uploadUrl) {

        $scope.assetName = name;
        $scope.assetTitle = title;
        $scope.assetContentType = contentType;
        $scope.assetUrl = uploadUrl;
        //$scope.selectedLocale = locale;
        txtAssetName.readOnly = true;
        btnAdd.value = "Update";
        $timeout(() => {
            $scope.updateTextFields();
          }, 10);
    }

    $scope.deleteAssetFromList = function (itemName) {
        for (var a in $scope.assetList) {
            if ($scope.assetList[a].assetName.toLowerCase() === itemName.toLowerCase()) {
                $scope.assetList.splice(a, 1);
                //localStorage.setItem('StoredData', JSON.stringify(spac));
                Materialize.toast('Hi, Gone to trash', 4000);
                break;
            }
        }
    }

    $scope.resetData = function () {

        btnAdd.value = "Add";
        $scope.assetName = "";
        $scope.assetTitle = "";
        $scope.assetContentType = "";
        $scope.assetUrl = "";
        //$scope.selectedLocale = ""; //Not working for select
        txtAssetName.readOnly = false;
        $timeout(() => {
            $scope.updateTextFields();
          }, 10);
        Materialize.toast('Oh! That vanished!', 4000);
    }
    /* End of Configuration methods */

    /* ######################################################################## */

    /* Start of Migration methods */

    //Upload assets to a Destination on Contentful

    $scope.uploadAsset = function (selectedAsset) {

        var fileName = selectedAsset.assetName;
        var assetID = selectedAsset.assetName.replace(/\s+/g, '').toLowerCase();
        var title = selectedAsset.assetTitle;
        var contentType = selectedAsset.assetContentType;
        var locale = selectedAsset.locale;
        var uploadPath = selectedAsset.assetUrl;
        //console.log('assetID:' + $scope.assetID + $scope.locale);
        var json = {
            fields: {
                file: {

                },

                title: {

                }
            }
        }

        json.fields.title[locale] = title;
        json.fields.file[locale] = {
            "contentType": contentType,
            "fileName": fileName,
            "upload": uploadPath
        }


        $scope.destSpace.createAssetWithId(assetID, json)
            .then((asset) => {
                asset.processForLocale(locale)
                    .then((assetProcessed) => {
                        assetProcessed.publish()
                            .then((assetPublished) => {
                                console.log(assetPublished);
                                $scope.successfulAssets.push(assetPublished);
                                for (var x in $scope.resultSet) {
                                    if ($scope.resultSet[x].id === assetPublished.sys.id && assetPublished.isPublished()) {
                                        $scope.resultSet[x].status = "Published";
                                    }
                                }
                                $scope.$apply();
                            }).catch((err) => {
                                var e = JSON.parse(err.message);
                                console.log(e.status + ':' + e.statusText);
                                for (var y in $scope.resultSet) {
                                    if ($scope.resultSet[y].id === assetProcessed.sys.id && !assetProcessed.isPublished()) {
                                        $scope.resultSet[y].status = e.status + ':' + e.statusText;
                                    }
                                }
                                $scope.$apply();
                            })
                    }).catch((err) => {
                        console.log(err);
                    });
            }).catch((err) => {
                $scope.destSpace.getAsset(assetID)
                    .then((asset) => {
                        asset.fields.title[locale] = title;
                        asset.fields.file[locale] = {
                            "contentType": contentType,
                            "fileName": fileName,
                            "upload": uploadPath
                        };
                        asset.update()
                            .then((assetUpdated) => {
                                assetUpdated.processForLocale(locale)
                                    .then((assetProcessed) => {
                                        assetProcessed.publish()
                                            .then((assetPublished) => {
                                                console.log(assetPublished);
                                                $scope.successfulAssets.push(assetPublished);
                                                for (var x in $scope.resultSet) {
                                                    if ($scope.resultSet[x].id === assetPublished.sys.id && assetPublished.isPublished()) {
                                                        $scope.resultSet[x].status = "Published";
                                                    }
                                                }
                                                $scope.$apply();
                                            }).catch((err) => {
                                                var e = JSON.parse(err.message);
                                                console.log(e.status + ':' + e.statusText);
                                                for (var y in $scope.resultSet) {
                                                    if ($scope.resultSet[y].id === assetProcessed.sys.id && !assetProcessed.isPublished()) {
                                                        $scope.resultSet[y].status = e.status + ':' + e.statusText;
                                                    }
                                                }
                                                $scope.$apply();
                                            })
                                    }).catch((err) => {
                                        console.log(err);
                                    })
                            }).catch((err) => {
                                console.log(err);
                            })
                    }).catch((err) => {
                        console.log(err);
                    })
            });
    }
    $scope.uploadToContentful = function () {
        $scope.successfulAssets = [];
        $scope.resultSet = [];
        $scope.selectedValues = $scope.assetList;
        var interval = 0;
        //loop for traversing selected items 
        angular.forEach($scope.selectedValues, function (selectedAsset) {
            $scope.resultSet.push({
                id: selectedAsset.assetName.replace(/\s+/g, '').toLowerCase(),
                status: "Started"
            });
            $timeout(function () {
                $scope.uploadAsset(selectedAsset);
            }, interval);
            interval = interval + 1000;
        }); //end of traversal loop 
    } //end of upload function

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
}]);