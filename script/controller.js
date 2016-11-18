var app = angular.module('cam', ['ngMaterial']);

app.controller('layoutController', ['$scope', '$http', '$q', '$timeout', '$window', '$filter', function ($scope, $http, $q, $timeout, $window, $filter) {
	//Variable Declaration
	$scope.spaces = spac;
	$scope.selectedfiles = {};
	$scope.destFiles = [];
	$scope.selectedSource = $scope.spaces[0];
	$scope.selectedDest = $scope.spaces[0];
	$scope.filelocale = [];
	$scope.sourceassetinfo = [];
	$scope.newfilesinfo = [];
	$scope.sourceData = [];
	var promises = [];
	var migratepromise = [];
	var processpromise = [];
	$scope.sourceconfig;
	$scope.desconfig;
	$scope.checksuccessful = [];
	$scope.checkerrorcase = [];
	//initialized with 0
	$scope.samlversion = 1;

	angular.isUndefinedOrNullOrEmpty = function (val) {
		return angular.isUndefined(val) || val === null || val === '';
	};


	//Fetch all published asset of a selected Sorce Space
	$scope.changedValue = function (srcitem) { //clear status if any
			if ($scope.checksuccessful.length > 0)
				$scope.checksuccessful.splice(0);

			if ($scope.checkerrorcase.length > 0)
				$scope.checkerrorcase.splice(0);

			$scope.srcitem = srcitem;

			if ($scope.srcitem.value == "0") {
				$scope.names = [];
				$scope.destFiles = [];
				return false;
			}
			if ($scope.srcitem.space == "Dev") {
				$scope.srcSpaceId = $scope.spaces[1].value;
				$scope.srcAccessToken = $scope.spaces[1].token;
			} else if ($scope.srcitem.space == "Stage") {
				$scope.srcSpaceId = $scope.spaces[2].value;
				$scope.srcAccessToken = $scope.spaces[2].token;
			} else if ($scope.srcitem.space == "ProdSupp") {
				$scope.srcSpaceId = $scope.spaces[3].value;
				$scope.srcAccessToken = $scope.spaces[3].token;
			} else if ($scope.srcitem.space == "TestSpace") {
				$scope.srcSpaceId = $scope.spaces[4].value;
				$scope.srcAccessToken = $scope.spaces[4].token;
			}

			//$scope.contentful = require('contentful-management')
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

	//Fetch dest assets
	$scope.getDestAssets = function (destitem) { //clear status if any
			if ($scope.checksuccessful.length > 0)
				$scope.checksuccessful.splice(0);
			if ($scope.checkerrorcase.length > 0)
				$scope.checkerrorcase.splice(0);

			$scope.destitem = destitem;

			if ($scope.destitem.value == "0") {
				$scope.selectedfiles = {};
				$scope.destFiles = [];
				return false;
			}

			if ($scope.destitem.space == "Dev") {
				$scope.destSpaceId = $scope.spaces[1].value;
				$scope.destAccessToken = $scope.spaces[1].token;
			} else if ($scope.destitem.space == "Stage") {
				$scope.destSpaceId = $scope.spaces[2].value;
				$scope.destAccessToken = $scope.spaces[2].token;
			} else if ($scope.destitem.space == "ProdSupp") {
				$scope.destSpaceId = $scope.spaces[3].value;
				$scope.destAccessToken = $scope.spaces[3].token;
			} else if ($scope.destitem.space == "TestSpace") {
				$scope.destSpaceId = $scope.spaces[4].value;
				$scope.destAccessToken = $scope.spaces[4].token;
			}

			$scope.destClient = contentfulManagement.createClient({
				// This is the access token for this space. Normally you get both ID and the token in the Contentful web app
				accessToken: $scope.destAccessToken
			});

			$scope.destClient.getSpace($scope.destSpaceId)
				.then((space) => {
					// Now that we have a space, we can get entries from that space
					$scope.destSpace = space;
					space.getAssets()
						.then((assets) => {
							$scope.destFiles = assets.items;
						});
				});

			// $http.get("https://api.contentful.com/spaces/"+ destitem.value + "/assets", $scope.destconfig)
			// 	.success(function(response) {
			// 		$scope.destFiles = response.items;
			// 	});
		} //andof getDestAssets



	function getDestFiles(fileName, locale, spaceID) {
		console.log(locale);
		for (var asset in $scope.destFiles) {

			if ($scope.destFiles[asset].sys.id == fileName) {
				return true;
			}

		}
	}
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
				asset.publish();
				//alert('published' + asset);
			});
	}
	$scope.cloneAsset = function (asset, locale, selectedIndex, assetID) {

		asset.fields.file = $scope.names[selectedIndex].fields.file;


		asset.update()
			.then((asset) => {
				//asset.sys.version = asset.sys.version+1;
				asset.publish();
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
			angular.forEach($scope.selectedvalues, function (key, selectedAssets) {
					//if key is true as in asset is selected
					if (key == true) {
						$scope.locale = selectedAssets.split("$")[0];
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

}]); //end of controller