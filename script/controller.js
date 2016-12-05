//var app = angular.module('cam', ['ngMaterial']);
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
    $scope.selectedfiles = {};
    $scope.checksuccessful = [];
    $scope.checkerrorcase = [];
    $scope.publishedAsset = [];
    $scope.checkCount = 0;


    $scope.$on('$viewContentLoaded', function () {
        //call it here
        $('select').material_select();
    });

    //Fetch all published asset of a selected Sorce Space
    $scope.changedValue = function (srcitem) { //clear status if any

            if ($scope.checksuccessful.length > 0)
                $scope.checksuccessful.splice(0);

            if ($scope.checkerrorcase.length > 0)
                $scope.checkerrorcase.splice(0);

            $scope.srcitem = $filter('filter')($scope.spaces, {
                space: srcitem
            })[0];
            $scope.srcSpaceId = $scope.srcitem.value;
            $scope.srcAccessToken = $scope.srcitem.token;

            // if ($scope.srcitem.value == "0") {
            // 	$scope.names = [];
            // 	return false;
            // }

            $scope.srcClient = contentfulManagement.createClient({
                // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
                accessToken: $scope.srcAccessToken
            })

            $scope.srcClient.getSpace($scope.srcSpaceId)
                .then((space) => {
                    // Now that we have a space, we can get entries from that space
                    space.getAssets()
                        .then((assets) => {
                            $scope.names = assets.items;
                            $scope.$apply();
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
        $scope.checkCount = $("input:checked").length;
    }, true);

    //Fetch dest assets
    $scope.getDestAssets = function (destitem) { //clear status if any
            if ($scope.checksuccessful.length > 0)
                $scope.checksuccessful.splice(0);
            if ($scope.checkerrorcase.length > 0)
                $scope.checkerrorcase.splice(0);

            $scope.destitem = destitem;
            $scope.destitem = $filter('filter')($scope.spaces, {
                space: destitem
            })[0];
            $scope.destSpaceId = $scope.destitem.value;
            $scope.destAccessToken = $scope.destitem.token;
            // if ($scope.destitem.value == "0") {
            // 	$scope.selectedfiles = {};
            // 	return false;
            // }

            $scope.destClient = contentfulManagement.createClient({
                // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
                accessToken: $scope.destAccessToken
            });

            $scope.destClient.getSpace($scope.destSpaceId)
                .then((space) => {
                    // Now that we have a space, we can get entries from that space
                    $scope.destSpace = space;
                });
        } //end of getDestAssets

    $scope.createNewAsset = function (locale, selectedIndex, assetID) {

        var json = {
            fields: {
                file: {

                },

                title: {

                }
            }
        }
        for (i = 0; i < locale.length; i++) {
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
                    .then((asset) => {
                        //asset.publish();
                        $scope.processAsset(locale, selectedIndex, assetID);
                    });
            });
    }
    $scope.updateAsset = function (asset, locale, selectedIndex, assetID) {
        for (i = 0; i < locale.length; i++) {
            asset.fields.file[locale[i]].url = $scope.names[selectedIndex].fields.file[locale[i]].url;
        }
        console.log('update' + asset + locale + selectedIndex + assetID);
        asset.update()
            .then((asset) => {
                //asset.sys.version = asset.sys.version+1;
                asset.publish()
                    .then((assetcall) => {
                        //asset.campublish = true;
                        $scope.publishedAsset.push(assetcall);
                        $scope.$apply();
                        console.log('published asset : ' + assetcall.fields.file.fileName + assetcall.sys.publishedVersion);
                    });
                //alert('published' + asset);
            });
    }
    $scope.cloneAsset = function (asset, locale, selectedIndex, assetID) {

        asset.fields.file = $scope.names[selectedIndex].fields.file;


        asset.update()
            .then((asset) => {
                //asset.sys.version = asset.sys.version+1;
                asset.publish()
                    .then((assetcall) => {
                        $scope.publishedAsset.push(assetcall);
                        $scope.$apply();
                        console.log('published asset c: ' + assetcall.fields.file.fileName + assetcall.sys.publishedVersion);
                    });
            });
    }
    $scope.processAsset = function (locale, selectedIndex, assetID) {

            $scope.destSpace.getAsset(assetID)
                .then((asset) => {

                    //$filter('filter')(scope.names, {fields.file[]id: 2 })[0];
                    //Console.log('updating Asset');
                    try {
                        $scope.updateAsset(asset, locale, selectedIndex, assetID);
                    } catch (err) {
                        console.log(err.message);
                        try {
                            $scope.cloneAsset(asset, locale, selectedIndex, assetID);
                        } catch (error) {
                            console.log('error in cloning Asset');
                        }

                    }


                    //asset.processForLocale($scope.locale);
                    //asset.publish();

                    // .then((asset) => {
                    // 	asset.processForLocale($scope.locale)
                    // 	.then((asset) => {
                    // 	asset.publish()
                    // 	})
                    // });
                }) //end of if for first time migration
                .catch(err => {
                    console.log("creating new asset " + selectedIndex + locale);
                    $scope.createNewAsset(locale, selectedIndex, assetID);
                });


        }
        //Migrate assets from source to Destination
    $scope.migratecontent = function (item) {

            $scope.selectedvalues = item;
            //loop for traversing selected items 
            $scope.tags = [];
            $scope.publishedAsset = [];
            angular.forEach($scope.selectedvalues, function (key, selectedAssets) {
                    //if key is true as in asset is selected
                    if (key == true) {
                        $scope.locale = selectedAssets.split("$")[0].split(":")[0];
                        $scope.selectedIndex = selectedAssets.split("$")[1];
                        $scope.assetID = $scope.names[$scope.selectedIndex].sys.id;
                        //$scope.currentAssetToMigrate = $scope.destSpace.getAsset($scope.assetID);
                        console.log('assetID:' + $scope.selectedIndex + $scope.locale);
                        //$scope.processAsset($scope.locale, $scope.selectedIndex, $scope.assetID);
                        //if the asset is moving for the first time to destination
                        //$scope.testasset = $scope.destSpace.getAsset($scope.assetID)
                        var tag = {
                            index: $scope.selectedIndex,
                            locale: $scope.locale,
                            assetID: $scope.assetID
                        }
                        $scope.tags.push(tag);
                    } //end of key=true if 

                }


            ); //end of traversal loop 
            $scope.sortedtags = $filter('orderBy')($scope.tags, 'assetID');
            var samplelasttag = {
                index: '',
                locale: '',
                assetID: ''
            }
            $scope.sortedtags.push(samplelasttag);
            var locs = [];
            for (i = 0; i < $scope.sortedtags.length - 1; i++) {
                if ($scope.sortedtags[i].assetID == $scope.sortedtags[i + 1].assetID) {
                    locs.push($scope.sortedtags[i].locale);
                } else {
                    console.log('process asset : ' + $scope.sortedtags[i].assetID);
                    locs.push($scope.sortedtags[i].locale);
                    $scope.processAsset(locs, $scope.sortedtags[i].index, $scope.sortedtags[i].assetID);
                    locs = [];

                }
            }

        } //end of migrate function
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
        Materialize.toast('BOOM ! BOOM !', 2000);

    }

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

}]);
//end of controller

app.controller('loginController', function () {

});