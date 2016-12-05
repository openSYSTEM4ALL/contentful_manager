app.controller('bulkController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', '$interval', function ($scope, $http, $q, $timeout, $window, $filter, $interval) {
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
    $('#ddlDestSpace').on('change', function (e) {
      if ($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text() != "") {
        $scope.getDestSpace($('#ddlDestSpace').siblings('.dropdown-content').find('li.active>span').text());
      }
    });

    $scope.spaces = spac;
    $scope.result = {};

    $scope.deleteAssetFromList = function (name) {
      for (var a in $scope.result.data) {
        if ($scope.result.data[a].asset_name == name) {
          $scope.result.data.splice(a, 1);
          //localStorage.setItem('StoredData', JSON.stringify(spac));
          Materialize.toast('Hi, Gone to trash', 4000);
          break;
        }
      }
    }

    $scope.getDestSpace = function (destSpaceSelected) {

      $scope.destitem = destSpaceSelected;
      $scope.destitem = $filter('filter')($scope.spaces, {
        space: destSpaceSelected
      })[0];
      $scope.destSpaceId = $scope.destitem.value;
      $scope.destAccessToken = $scope.destitem.token;
      $scope.destClient = contentfulManagement.createClient({
        // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
        accessToken: $scope.destAccessToken
      });

      $scope.destClient.getSpace($scope.destSpaceId)
        .then((space) => {
          // Now that we have a space, we can get locales from that space
          $scope.destSpace = space;
        }).catch((err) => {
          console.log(err);
        });
    }

    //Upload assets to a destination on Contentful

    $scope.uploadAsset = function (selectedAsset) {

      var fileName = selectedAsset.asset_name;
      var assetID = selectedAsset.asset_name.replace(/\s+/g, '').toLowerCase();
      var title = selectedAsset.asset_title;
      var contentType = selectedAsset.content_type;
      var locale = selectedAsset.locale;
      var uploadPath = selectedAsset.url;
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
                  selectedAsset.status = 'published';
                  console.log(assetPublished);
                  $scope.successfulAssets.push(assetPublished);
                  $scope.$apply();
                }).catch((err) => {
                  $scope.$apply(function () {
                    var e = JSON.parse(err.message);
                    selectedAsset.status = 'error';
                    selectedAsset.error = e.status + ':' + e.statusText;
                  });
                  console.log(err);
                })
            }).catch((err) => {
              $scope.$apply(function () {
                var e = JSON.parse(err.message);
                selectedAsset.status = 'error';
                selectedAsset.error = e.status + ':' + e.statusText;
              });
              console.log(err);
            });
        }).catch((err) => {
          $scope.destSpace.getAsset(assetID)
            .then((asset) => {
              asset.fields.file[locale] = {
                "contentType": contentType,
                "fileName": fileName,
                "upload": uploadPath
              }
              asset.update()
                .then((assetUpdated) => {
                  assetUpdated.processForLocale(locale)
                    .then((assetProcessed) => {
                      assetProcessed.publish()
                        .then((assetPublished) => {
                          selectedAsset.status = 'published';
                          console.log(assetPublished);
                          $scope.successfulAssets.push(assetPublished);
                          $scope.$apply();
                        }).catch((err) => {
                          $scope.$apply(function () {
                            var e = JSON.parse(err.message);
                            selectedAsset.status = 'error';
                            selectedAsset.error = e.status + ':' + e.statusText;
                          });
                          console.log(err);
                        })
                    }).catch((err) => {
                      $scope.$apply(function () {
                        var e = JSON.parse(err.message);
                        selectedAsset.status = 'error';
                        selectedAsset.error = e.status + ':' + e.statusText;
                      });
                      console.log(err);
                    })
                }).catch((err) => {
                  $scope.$apply(function () {
                    var e = JSON.parse(err.message);
                    selectedAsset.status = 'error';
                    selectedAsset.error = e.status + ':' + e.statusText;
                  });
                  console.log(err);
                })
            }).catch((err) => {
              $scope.$apply(function () {
                var e = JSON.parse(err.message);
                selectedAsset.status = 'error';
                selectedAsset.error = e.status + ':' + e.statusText;
              });
              console.log(err);
            })
        });
    }

    $scope.bulkUploadToContentful = function () {
        $scope.selectedValues = $scope.result.data;
        //loop for traversing selected items 
        var interval = 0;
        angular.forEach($scope.selectedValues, function (selectedAsset) {
          selectedAsset.status = 'start';
          console.log('interval:' + interval);
          $timeout(function () {
            $scope.uploadAsset(selectedAsset);
          }, interval);
          interval = interval + 2500;
          //$timeout($scope.uploadAsset(selectedAsset), interval);
        }); //end of traversal loop 
      } //end of upload function
  }])
  .directive("fileread", [function () {
    return {
      scope: {
        opts: '='
      },
      link: function ($scope, $elm, $attrs) {
        $elm.on('change', function (changeEvent) {
          var reader = new FileReader();

          reader.onload = function (evt) {
            $scope.$apply(function () {
              var data = evt.target.result;

              var workbook = XLSX.read(data, {
                type: 'binary'
              });

              var headerNames = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
                header: 1
              })[0];

              var data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

              $scope.opts.columnDefs = [];
              headerNames.forEach(function (h) {
                $scope.opts.columnDefs.push({
                  field: h
                });
              });

              $scope.opts.data = data;

              $elm.val(null);
            });
          };

          reader.readAsBinaryString(changeEvent.target.files[0]);
        });
      }
    }
  }]);