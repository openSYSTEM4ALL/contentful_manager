var spac = [];
var storedData = localStorage.getItem('StoredData')
if (storedData) {
    spac = JSON.parse(storedData);
}
app.controller('layoutController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', function ($scope, $http, $q, $timeout, $window, $filter) {

    $('ul.tabs').tabs();
    angular.isUndefinedOrNullOrEmpty = function (val) {
        return angular.isUndefined(val) || val === null || val === '';
    };

    $scope.spaces = spac;
    $scope.totalAssets = 0;
    $scope.totalAssetCount = 0;
    $scope.selectedfiles = {};
    $scope.parseInt = parseInt;
    $scope.publishedAsset = [];
    $scope.resultSet = [];
    $scope.checkCount = 0;
    $scope.showActivity = true;
    $scope.displayTypeOptions = {
        option1: "Will show activity from start till the end for each asset",
        option2: "Will show only those assets which are published successfully"
    };


    $scope.$on('$viewContentLoaded', function () {
        //call it here
        $('select').material_select();
    });
    $scope.toggleAll = function () {
        var toggleStatus = !$scope.isAllSelected;
        if (!toggleStatus) {
            $('.filled-in.check-count').prop('checked', true);
        } else {
            $('.filled-in.check-count').prop('checked', false);
        }

        angular.forEach($scope.selectedfiles, function (key,value) {
           $scope.selectedfiles[value] = $scope.isAllSelected;
        });

    }
    $scope.toggleSelectAll = function () {
        var keepGoing = true;
        angular.forEach($scope.selectedfiles, function (key, value) {
            if (keepGoing) {
                console.log("value" + value);
                if ($scope.selectedfiles[value] != true) {
                    $scope.isAllSelected = false;
                    keepGoing = false;
                }
                else {
                    $scope.isAllSelected = true;
                }
            }
            });
        
    }
    //Fetch all assets of the selected Source Space
    $scope.changedValue = function (srcitem) {

        $scope.srcitem = $filter('filter')($scope.spaces, {
            space: srcitem
        })[0];
        $scope.srcSpaceId = $scope.srcitem.value;
        $scope.srcAccessToken = $scope.srcitem.token;

        $scope.srcClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: $scope.srcAccessToken
        })

        $scope.srcClient.getSpace($scope.srcSpaceId)
            .then((space) => {
                // Now that we have a space, we can get assets from that space
                space.getAssets({
                        skip: "0",
                        order: "sys.createdAt"
                    })
                    .then((assets) => {
                        $scope.totalAssets = assets.total;
                        $scope.names = assets.items;                        
                        $scope.countSourceAssets();
                        $scope.$apply();
                    }).catch((err) => {
                        var e = JSON.parse(err.message);
                        console.log(e.status + ':' + e.statusText);
                    })
            });
    } // end of changedvalue  

    //changed values
    $('#ddlSrcSpace').on('change', function (e) {
        //var optionSelected = $(this).find("option:selected");
        //var valueSelected  = optionSelected.val();
        //var textSelected   = optionSelected.text();
        $scope.srcSpac = $('#ddlSrcSpace').siblings('.dropdown-content').find('li.active>span').text();
        $scope.$apply();
        if ($('#ddlSrcSpace').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.changedValue($('#ddlSrcSpace').siblings('.dropdown-content').find('li.active>span').text());
        }
    });
    $('#ddlDestSpace').on('change', function (e) {
        // $scope.getDestAssets($scope.selectedDest.space);
        //$('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text()
        $scope.desSpac = $('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text();
        $scope.$apply();
        if ($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text() != "") {
            $scope.getDestAssets($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text());
        }
    });
    $scope.$watch('selectedfiles', function () {
      
        $scope.checkCount = $("input:checked.check-count").length;
    }, true);

    $scope.countSourceAssets = function() {
        var totalCount = 0;
        angular.forEach($scope.names, function(asset) {
            angular.forEach(asset.fields.file, function(localeFile) {
                totalCount += 1;
            })
        })
        $scope.totalAssetCount = totalCount;
    }

    //Fetch dest space - Can be edited if all destination assets are required to be fetched
    $scope.getDestAssets = function (destitem) {

        $scope.destitem = destitem;
        $scope.destitem = $filter('filter')($scope.spaces, {
            space: destitem
        })[0];
        $scope.destSpaceId = $scope.destitem.value;
        $scope.destAccessToken = $scope.destitem.token;

        $scope.destClient = contentfulManagement.createClient({
            // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
            accessToken: $scope.destAccessToken
        });

        $scope.destClient.getSpace($scope.destSpaceId)
            .then((space) => {
                // Now that we have a space, we can get assets from that space
                $scope.destSpace = space;
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            });
    } //end of getDestAssets

    // This method can be used after create as well as update operation to process the asset for multiple locales
    $scope.processAfterCreateOrUpdate = function (updatedAsset, locale) {
        for (i = 0; i < locale.length; i++) {
            updatedAsset.processForLocale(locale[i])
                .then((processedAsset) => {
                    processedAsset.publish()
                        .then((assetPublished) => {
                            $scope.publishedAsset.push(assetPublished);
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
                                if ($scope.resultSet[y].id === processedAsset.sys.id && !processedAsset.isPublished()) {
                                    $scope.resultSet[y].status = e.status + ':' + e.statusText;
                                }
                            }
                            $scope.$apply();
                        });
                }).catch((err) => {
                    var e = JSON.parse(err.message);
                    console.log(e.status + ':' + e.statusText);
                });
        }
    }

    //This method is to create a new asset
    $scope.createNewAsset = function (locale, selectedIndex, assetID) {

        var json = {
            fields: {
                file: {

                },

                title: {

                }
            }
        }
        for (var i = 0; i < locale.length; i++) {
            json.fields.title[locale[i]] = $scope.names[selectedIndex].fields.title[locale[i]];
            json.fields.file[locale[i]] = {
                "contentType": $scope.names[selectedIndex].fields.file[locale[i]].contentType,
                "fileName": $scope.names[selectedIndex].fields.file[locale[i]].fileName,
                "upload": "https:" + $scope.names[selectedIndex].fields.file[locale[i]].url
            }
        }

        $scope.destSpace.createAssetWithId(assetID, json)
            .then((asset) => {
                asset.processForAllLocales()
                    .then((processedAsset) => {
                        processedAsset.publish()
                            .then((assetPublished) => {
                                $scope.publishedAsset.push(assetPublished);
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
                                    if ($scope.resultSet[y].id === processedAsset.sys.id && !processedAsset.isPublished()) {
                                        $scope.resultSet[y].status = e.status + ':' + e.statusText;
                                    }
                                }
                                $scope.$apply();
                            });
                    }).catch((err) => {
                        var e = JSON.parse(err.message);
                        console.log(e.status + ':' + e.statusText);
                    });
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            });
    }

    //This method is to update an asset
    $scope.updateAsset = function (asset, locale, selectedIndex, assetID) {
        for (var i = 0; i < locale.length; i++) {
            asset.fields.title[locale[i]] = $scope.names[selectedIndex].fields.title[locale[i]];
            asset.fields.file[locale[i]] = {
                "contentType": $scope.names[selectedIndex].fields.file[locale[i]].contentType,
                "fileName": $scope.names[selectedIndex].fields.file[locale[i]].fileName,
                "upload": "https:" + $scope.names[selectedIndex].fields.file[locale[i]].url
            }
        }
        //console.log('update' + asset + locale + selectedIndex + assetID);
        asset.update()
            .then((updatedAsset) => {
                $scope.processAfterCreateOrUpdate(updatedAsset, locale);
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            });
    }

    //This method is to update an asset which has a blank 'file' object in fields
    $scope.cloneAsset = function (asset, locale, selectedIndex, assetID) {

        for (var i = 0; i < locale.length; i++) {
            asset.fields.title[locale[i]] = $scope.names[selectedIndex].fields.title[locale[i]];
            asset.fields.file[locale[i]] = {
                "contentType": $scope.names[selectedIndex].fields.file[locale[i]].contentType,
                "fileName": $scope.names[selectedIndex].fields.file[locale[i]].fileName,
                "upload": "https:" + $scope.names[selectedIndex].fields.file[locale[i]].url
            }
        }
        asset.update()
            .then((updatedAsset) => {
                $scope.processAfterCreateOrUpdate(updatedAsset, locale);
            }).catch((err) => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
            });
    }

    //This method decides where to send the asset for migration
    $scope.processAsset = function (locale, selectedIndex, assetID) {

        $scope.destSpace.getAsset(assetID)
            .then((asset) => {
                try {
                    $scope.updateAsset(asset, locale, selectedIndex, assetID);
                } catch (err) {
                    console.log('error in updating the Asset');
                    var e = JSON.parse(err.message);
                    console.log(e.status + ':' + e.statusText);
                    try {
                        $scope.cloneAsset(asset, locale, selectedIndex, assetID);
                    } catch (error) {
                        console.log('error in cloning the Asset');
                    }
                }
            }) //end of if for first time migration
            .catch(err => {
                var e = JSON.parse(err.message);
                console.log(e.status + ':' + e.statusText);
                $scope.createNewAsset(locale, selectedIndex, assetID);
            });
    }

    //Migrate Button Click - Migrate assets from source to Destination
    $scope.migratecontent = function (item) {

        $scope.selectedvalues = item;
        $scope.tags = [];
        $scope.publishedAsset = [];
        $scope.resultSet = [];

        //loop for traversing selected items 
        angular.forEach($scope.selectedvalues, function (key, selectedAssets) {
            //if key is true as in asset is selected
            if (key == true) {
                $scope.locale = selectedAssets.split("$")[0].split(":")[0];
                $scope.selectedIndex = selectedAssets.split("$")[1];
                $scope.assetID = $scope.names[$scope.selectedIndex].sys.id;

                console.log('assetID:' + $scope.selectedIndex + $scope.locale);

                var tag = {
                    index: $scope.selectedIndex,
                    locale: $scope.locale,
                    assetID: $scope.assetID
                }
                $scope.tags.push(tag);
            } //end of key=true if 
        }); //end of traversal loop 

        $scope.sortedtags = $filter('orderBy')($scope.tags, 'assetID');
        var samplelasttag = {
            index: '',
            locale: '',
            assetID: ''
        }
        $scope.sortedtags.push(samplelasttag);
        var locs = [];

        for (var i = 0; i < $scope.sortedtags.length - 1; i++) {
            if ($scope.sortedtags[i].assetID == $scope.sortedtags[i + 1].assetID) {
                locs.push($scope.sortedtags[i].locale);
            } else {
                console.log('process asset : ' + $scope.sortedtags[i].assetID);
                locs.push($scope.sortedtags[i].locale);
                $scope.resultSet.push({
                    id: $scope.sortedtags[i].assetID,
                    status: "Started"
                });

                $scope.processAsset(locs, $scope.sortedtags[i].index, $scope.sortedtags[i].assetID);

                locs = [];
            }
        }
    } //end of migrate function

    $.expr[":"].contains = $.expr.createPseudo(function (arg) {
        return function (elem) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
    $(function () {
        $('#searchAsset').keyup(function () {
            var matches = $('ul#sourceAssets').find('li:contains(' + $(this).val() + ') ');
            $('li', 'ul#sourceAssets').not(matches).slideUp();
            matches.slideDown();
        });
    });

    /* End of Migration methods */

    /* ######################################################################## */

    /* Start of Configuration methods */

    $scope.saveConfigurations = function () {
        if (txtSpaceName.value.length <= 0 || txtSpaceId.value.length <= 0 || txtMgmntTkn.value.length <= 0) {
            Materialize.toast('Please enter required values', 2000);

        } else {
            if (btnSave.value == "Update") {
                for (var v in spac) {
                    if (spac[v].value == $scope.spaceID) {
                        spac[v].space = $scope.spaceName;
                        spac[v].token = $scope.mgmntToken;
                    }
                }
                btnSave.value = "Save";

            } else {
                var duplicate = false;
                for (var v in spac) {
                    if (spac[v].value == $scope.spaceID) {
                        Materialize.toast('Enter unique value for Space ID', 2000);
                        $scope.spaceID = "";
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) {
                    spac.push({
                        value: $scope.spaceID,
                        space: $scope.spaceName,
                        token: $scope.mgmntToken
                    });
                    localStorage.setItem('StoredData', JSON.stringify(spac));

                    $scope.spaceName = "";
                    $scope.mgmntToken = "";
                    $scope.spaceID = "";
                    Materialize.toast('Congrats! Your operation was successfull', 2000);
                }
            }
        }
    }
    $scope.editValues = function (value, space, token) {

        $scope.spaceName = space;
        $scope.spaceID = value;
        txtSpaceId.readOnly = true;
        $scope.mgmntToken = token;
        btnSave.value = "Update";
    }
    $scope.deleteSpace = function (value) {
        for (var v in spac) {
            if (spac[v].value == value) {
                console.log(v);
                spac.splice(v, 1);
                localStorage.setItem('StoredData', JSON.stringify(spac));
                Materialize.toast('Hi, Gone to trash', 2000);
                break;
            }
        }
    }
    $scope.resetValues = function () {

        btnSave.value = "Save";
        $scope.spaceID = "";
        $scope.spaceName = "";
        $scope.mgmntToken = "";
        txtSpaceId.readOnly = false;
        Materialize.toast('Oh! That vanished!', 2000);
    }


}]);
//end of controller

app.controller('loginController', function () {

});