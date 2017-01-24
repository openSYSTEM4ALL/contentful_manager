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

    $scope.deleteAssetFromList = function (name,locale) {
      for (var a in $scope.result.data) {
        if ($scope.result.data[a].asset_name == name && $scope.result.data[a].locale == locale) {
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
      }, true)[0];
      $scope.destSpaceId = $scope.destitem.value;
      $scope.destAccessToken = $scope.destitem.token;
      $scope.destClient = contentfulManagement.createClient({
        // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
        accessToken: $scope.destAccessToken
      });
      $scope.destClient.getSpace($scope.destSpaceId)
        .then((space) => {
          // Now that we have a space, we can get locales from that space
          $scope.defaultDestLocale = "";
          $scope.destSpace = space;
          $scope.$apply();
          space.getLocales()
            .then((locales) => {
              $scope.destLocales = locales.items;

              // find default locale
              var defaultFound = false;
              angular.forEach($scope.destLocales, function (destLocale) {
                if (!defaultFound) {
                  if (destLocale.default == true) {
                    $scope.defaultDestLocale = destLocale.code;
                    $scope.$apply();
                    defaultFound = true;
                  }
                }
              });
            })

        }).catch((err) => {
          $scope.defaultDestLocale = "";
          $scope.$apply();
          console.log(err);
        });
    }

    $scope.setassetstatus = function (name, status, msg) {
      angular.forEach($scope.selectedValues, function (selectedAsset) {
        if (selectedAsset.asset_name == name) {
          if (status == 'published') {
            selectedAsset.status = status;
          } else {
            selectedAsset.status = status;
            selectedAsset.error = msg;
          }

        }
      });
    };
    $scope.multiplelocaleupload = function (multiple, json, selectedAsset) {
      var assetID = multiple[0].asset_name.replace(/\s+/g, '').toLowerCase();
      $scope.destSpace.createAssetWithId(assetID, json)
        .then((asset) => {
          asset.processForAllLocales()
            .then((assetProcessed) => {
              $scope.destSpace.getAsset(assetProcessed.sys.id)
                .then((asset) => {
                  asset.publish()
                })
              //assetProcessed.publish()
                .then((assetPublished) => {
                  selectedAsset.status = 'published';
                  $scope.setassetstatus(selectedAsset.asset_name, 'published', 'published');
                  console.log(assetPublished);
                  //$scope.successfulAssets.push(assetPublished);
                  $scope.$apply();
                }).catch((err) => {
                  $scope.$apply(function () {
                    var e = JSON.parse(err.message);
                    selectedAsset.status = 'error';
                    selectedAsset.error = e.status + ':' + e.statusText;
                    $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
                  });
                  console.log(err);
                })
            }).catch((err) => {
              $scope.$apply(function () {
                var e = JSON.parse(err.message);
                selectedAsset.status = 'error';
                selectedAsset.error = e.status + ':' + e.statusText;
                $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
              });
              console.log(err);
            });
        }).catch((err) => {
          $scope.destSpace.getAsset(assetID)
            .then((asset) => {

              for (k = 0; k < multiple.length; k++) {
                asset.fields.file[multiple[k].locale] = {
                  "contentType": multiple[k].content_type,
                  "fileName": multiple[k].asset_name.replace(/\s+/g, '').toLowerCase(),
                  "upload": multiple[k].url
                }
              }

              asset.update()
                .then((assetUpdated) => {
                  assetUpdated.processForAllLocales()
                    .then((assetProcessed) => {
                      //twek to esolve 409 confict
                      $scope.destSpace.getAsset(assetProcessed.sys.id)
                        .then((asset) => {
                          asset.publish()
                        })
                        //assetProcessed.publish()
                        .then((assetPublished) => {
                          selectedAsset.status = 'published';
                          console.log(assetPublished);
                          $scope.setassetstatus(selectedAsset.asset_name, 'published', 'published');
                          //$scope.successfulAssets.push(assetPublished);
                          $scope.$apply();
                        }).catch((err) => {
                          $scope.$apply(function () {
                            var e = JSON.parse(err.message);
                            selectedAsset.status = 'error';
                            selectedAsset.error = e.status + ':' + e.statusText;
                            $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
                          });
                          console.log(err);
                        })
                    }).catch((err) => {
                      $scope.$apply(function () {
                        var e = JSON.parse(err.message);
                        selectedAsset.status = 'error';
                        selectedAsset.error = e.status + ':' + e.statusText;
                        $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
                      });
                      console.log(err);
                    })
                }).catch((err) => {
                  $scope.$apply(function () {
                    var e = JSON.parse(err.message);
                    selectedAsset.status = 'error';
                    selectedAsset.error = e.status + ':' + e.statusText;
                    $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
                  });
                  console.log(err);
                })
            }).catch((err) => {
              $scope.$apply(function () {
                var e = JSON.parse(err.message);
                selectedAsset.status = 'error';
                selectedAsset.error = e.status + ':' + e.statusText;
                $scope.setassetstatus(selectedAsset.asset_name, 'error', selectedAsset.error);
              });
              console.log(err);
            })
        });

    };

    //Upload assets to a destination on Contentful

    $scope.uploadAsset = function (selectedAsset) {

      //multiple locale
      $scope.multiple = [];
      $scope.multiple = $filter('filter')($scope.selectedValues, {
        asset_name: selectedAsset.asset_name
      }, true);
      var json = {
        fields: {
          file: {

          },

          title: {

          }
        }
      };
      if ($scope.multiple.length > 1) {

        for (j = 0; j < $scope.multiple.length; j++) {
          json.fields.title[$scope.multiple[j].locale] = $scope.multiple[j].asset_title;
          json.fields.file[$scope.multiple[j].locale] = {
            "contentType": $scope.multiple[j].content_type,
            "fileName": $scope.multiple[j].asset_name.replace(/\s+/g, '').toLowerCase(),
            "upload": $scope.multiple[j].url
          }
        }

        $scope.multiplelocaleupload($scope.multiple, json, selectedAsset);

      } else {



        var fileName = selectedAsset.asset_name;
        var assetID = selectedAsset.asset_name.replace(/\s+/g, '').toLowerCase();
        var title = selectedAsset.asset_title;
        var contentType = selectedAsset.content_type;
        var locale = selectedAsset.locale;
        var uploadPath = selectedAsset.url;
        //console.log('assetID:' + $scope.assetID + $scope.locale);


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
                    //$scope.successfulAssets.push(assetPublished);
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
                            //$scope.successfulAssets.push(assetPublished);
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
    };
    $scope.bulkUploadToContentful = function () {
      $scope.selectedValues = $scope.result.data;
      //loop for traversing selected items 
      var interval = 0;

      /*   for (i = 0; i < $scope.selectedValues.length; i++) {
           console.log('value of i ' + i);
           if (i != $scope.selectedValues.length - 1 && $scope.selectedValues[i].asset_name == $scope.selectedValues[i + 1].asset_name) {
             $scope.selectedValues[i].status = 'start';
             //just skip the duplicate
           } else {
             $scope.selectedValues[i].status = 'start';
             $scope.uploadAsset($scope.selectedValues[i]);

           }
         }  */
      var assetprev = '';
      angular.forEach($scope.selectedValues, function (selectedAsset) {

        selectedAsset.status = 'start';
        if (selectedAsset.asset_name != assetprev) {
          console.log('interval:' + interval + 'assetname' + selectedAsset.asset_name);
          $timeout(function () {
            $scope.uploadAsset(selectedAsset);
          }, interval);
          interval = interval + 2000;
          assetprev = selectedAsset.asset_name;
        }
        //$timeout($scope.uploadAsset(selectedAsset), interval);
      }); //end of traversal loop 

    }; //end of upload function
  }])
  .directive("fileread", ['$filter', function ($filter) {
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

              //$scope.opts.data = data;
              $scope.opts.data = $filter('orderBy')(data, 'asset_name');
              var defLocale = $("#defaultLocale").val();
              for (z = $scope.opts.data.length - 1; z > 0; z--) {
                if ($scope.opts.data[z].asset_name == $scope.opts.data[z - 1].asset_name && $scope.opts.data[z].locale == defLocale) {
                  var asset = $scope.opts.data[z - 1];
                  $scope.opts.data[z - 1] = $scope.opts.data[z];
                  $scope.opts.data[z] = asset;
                }
              }

              $elm.val(null);
            });
          };

          reader.readAsBinaryString(changeEvent.target.files[0]);
        });
      }
    }
  }]);