/**
 * @ngdoc controller
 * @name Umbraco.Editors.DocumentType.EditController
 * @function
 *
 * @description
 * The controller for the content type editor
 */
(function() {
	"use strict";

	function DocumentTypeEditController($scope, $routeParams, contentTypeResource, dataTypeResource, editorState, contentEditingHelper, formHelper, navigationService, iconHelper, contentTypeHelper, notificationsService, $filter, modelsResource, $timeout) {

		var vm = this;

		vm.save = save;
		vm.buildModels = buildModels;

		vm.currentNode = null;
		vm.contentType = {};
		vm.page = {};
		vm.page.loading = false;
		vm.page.saveButtonState = "init";
	    vm.page.modelsButtonState = "init";
		vm.page.navigation = [
			{
				"name": "Design",
				"icon": "icon-document-dashed-line",
				"view": "views/documentType/views/design/design.html",
				"active": true
			},
			{
				"name": "List view",
				"icon": "icon-list",
				"view": "views/documentType/views/listview/listview.html"
			},
			{
				"name": "Permissions",
				"icon": "icon-keychain",
				"view": "views/documentType/views/permissions/permissions.html"
			},
			{
				"name": "Templates",
				"icon": "icon-layout",
				"view": "views/documentType/views/templates/templates.html"
			}
		];

		vm.page.keyboardShortcutsOverview = [
			{
				"name": "Sections",
				"shortcuts": [
					{
						"description": "Navigate sections",
						"keys": [{"key": "1"}, {"key": "4"}],
						"keyRange": true
					}
				]
			},
			{
				"name": "Design",
				"shortcuts": [
				{
					"description": "Add tab",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "t"}]
				},
				{
					"description": "Add property",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "p"}]
				},
				{
					"description": "Add editor",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "e"}]
				},
				{
					"description": "Edit data type",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "d"}]
				}
			]
		},
		{
			"name": "List view",
			"shortcuts": [
				{
					"description": "Toggle list view",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "l"}]
				}
			]
		},
		{
			"name": "Permissions",
			"shortcuts": [
				{
					"description": "Toggle allow as root",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "r"}]
				},
				{
					"description": "Add child node",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "c"}]
				}
			]
		},
		{
			"name": "Templates",
			"shortcuts": [
				{
					"description": "Add template",
					"keys": [{"key": "alt"},{"key": "shift"},{"key": "t"}]
				}
			]
		}
		];

		vm.page.areModelsOutOfDate = false;
	    vm.page.modelsButtonStyle = "";
	    modelsResource.getModelsOutOfDateStatus()
	        .then(function (json) {
	            var status = angular.fromJson(json);
	            if (status === "out-of-date") {
	                vm.page.areModelsOutOfDate = true;
	                vm.page.modelsButtonStyle = "warning";
                }
	        });

		if ($routeParams.create) {

			vm.page.loading = true;

			//we are creating so get an empty data type item
			contentTypeResource.getScaffold($routeParams.id)
				.then(function(dt) {

					init(dt);

					vm.page.loading = false;

				});
		}
		else {

			vm.page.loading = true;

			contentTypeResource.getById($routeParams.id).then(function(dt){
				init(dt);

				syncTreeNode(vm.contentType, dt.path, true);

				vm.page.loading = false;

			});
		}

	    // fixme - need a better confirm
        // fixme - need a way to know whether the app will restart?

		function buildModels() {
		    // that works...
            /*
		    if (confirm("Rebuild models and restart the app - Sure?")) {
		        vm.page.modelsButtonState = "busy";
		        modelsResource.buildModels().then(function () {
		            modelsResource.getModelsOutOfDateStatus()
                        .then(function (json) {
                            var status = angular.fromJson(json);
                            var areModelsOutOfDate = (status === "out-of-date");
                            vm.page.modelsButtonState = "success";
		                    if (areModelsOutOfDate)
		                        notificationsService.warning("Models have been rebuilt but are still out-of-date.");
		                    else
		                        notificationsService.success("Models have been rebuilt and are now up-to-date.");
		                    $timeout(function() {
		                        vm.page.areModelsOutOfDate = areModelsOutOfDate;
		                    }, 500);
		                });
		        });
		    }
            */
            // but that should be more kosher
		    vm.modelsOverlay = {};
		    vm.modelsOverlay.title = "ModelsBuilder";
		    vm.modelsOverlay.view = "views/documenttype/overlays/models/models.html";
		    vm.modelsOverlay.show = true;

		    vm.modelsOverlay.page = {};
		    vm.modelsOverlay.page.areModelsOutOfDate = vm.page.areModelsOutOfDate;
		    vm.modelsOverlay.page.modelsButtonState = "init";
		    vm.modelsOverlay.page.modelsButtonStyle = vm.page.areModelsOutOfDate ? "warning" : "";

		    vm.modelsOverlay.page.buildModels = function (outOfDate) {
		        vm.modelsOverlay.page.modelsButtonState = "busy";
		        modelsResource.buildModels().then(function() {
		            modelsResource.getModelsOutOfDateStatus()
                        .then(function (json) {
                            var status = angular.fromJson(json);

                            vm.modelsOverlay.page.areModelsOutOfDate = (status === "out-of-date");
		                    vm.page.areModelsOutOfDate = vm.modelsOverlay.page.areModelsOutOfDate;

		                    vm.modelsOverlay.page.modelsButtonStyle = vm.page.areModelsOutOfDate ? "warning" : "";
		                    vm.page.modelsButtonStyle = vm.modelsOverlay.page.modelsButtonStyle;

                            vm.modelsOverlay.page.modelsButtonState = "init";

                            if (vm.page.areModelsOutOfDate) {
                                notificationsService.warning("Models have been rebuilt but are still out-of-date.");
                                vm.page.modelsButtonStyle = "warning";
                            } else {
                                notificationsService.success("Models have been rebuilt and are now up-to-date.");
                                vm.page.modelsButtonStyle = "";
                            }
                        });
		        });
		    };

		    // no! else there's a 'submit' button!
            /*
		    vm.modelsOverlay.submit = function (model) {

		        //_.each(model.selectedImages, function (media, i) {

		        //    if (!media.thumbnail) {
		        //        media.thumbnail = mediaHelper.resolveFileFromEntity(media, true);
		        //    }

		        //    $scope.images.push(media);
		        //    $scope.ids.push(media.id);
		        //});

		        //$scope.sync();

		        vm.modelsOverlay.show = false;
		        vm.modelsOverlay = null;
		    };
            */

		    vm.modelsOverlay.close = function (oldModel) {
		        vm.modelsOverlay.show = false;
		        vm.modelsOverlay = null;

		        modelsResource.getModelsOutOfDateStatus()
                    .then(function (json) {
                        var status = angular.fromJson(json);
                        if (status === "out-of-date")
                            vm.page.areModelsOutOfDate = true;
                    });
		    };

		    return;
            alert("build!");
            scope.modelsDialogModel = {};
            scope.modelsDialogModel.title = "Models";
            scope.modelsDialogModel.view = "views/documentType/dialogs/models/models.html";
            scope.modelsDialogModel.show = true;

            scope.compositionsDialogModel.submit = function () {

                // do our stuff

                // remove overlay
                scope.compositionsDialogModel.show = false;
                scope.compositionsDialogModel = null;
            };

            scope.compositionsDialogModel.close = function () {
                // do our stuff

                // remove overlay
                scope.compositionsDialogModel.show = false;
                scope.compositionsDialogModel = null;
            };
        }


		/* ---------- SAVE ---------- */

		function save() {

			// validate form
			if (formHelper.submitForm({ scope: $scope })) {

				formHelper.resetForm({ scope: $scope });

				// if form validates - perform save
				performSave();

			}

		}

		function performSave() {

			vm.page.saveButtonState = "busy";

			// reformat allowed content types to array if id's
			vm.contentType.allowedContentTypes = contentTypeHelper.createIdArray(vm.contentType.allowedContentTypes);

			// update placeholder template information on new doc types
			if (!$routeParams.notemplate && vm.contentType.id === 0) {
				vm.contentType = contentTypeHelper.updateTemplatePlaceholder(vm.contentType);
			}

			contentTypeResource.save(vm.contentType).then(function(dt){

				formHelper.resetForm({ scope: $scope, notifications: dt.notifications });
				contentEditingHelper.handleSuccessfulSave({
					scope: $scope,
					savedContent: dt,
					rebindCallback: function() {

					}
				});

				notificationsService.success("Document type save");
				//post save logic here -the saved doctype returns as a new object
				init(dt);

				syncTreeNode(vm.contentType, dt.path);

				vm.page.saveButtonState = "success";

				vm.page.areModelsOutOfDate = true;
			    vm.page.modelsButtonStyle = "warning";
			});

		}


		function init(contentType){

			// set all tab to inactive
			if( contentType.groups.length !== 0 ) {
				angular.forEach(contentType.groups, function(group){

					angular.forEach(group.properties, function(property){
						// get data type details for each property
						getDataTypeDetails(property);
					});

				});
			}

			// convert legacy icons
			convertLegacyIcons(contentType);

			// sort properties after sort order
			angular.forEach(contentType.groups, function(group){
				group.properties = $filter('orderBy')(group.properties, 'sortOrder');
			});

			// insert template on new doc types
			if (!$routeParams.notemplate && contentType.id === 0) {
				contentType.defaultTemplate = contentTypeHelper.insertDefaultTemplatePlaceholder(contentType.defaultTemplate);
				contentType.allowedTemplates = contentTypeHelper.insertTemplatePlaceholder(contentType.allowedTemplates);
			}

			//set a shared state
			editorState.set(contentType);

			vm.contentType = contentType;

		}

		function convertLegacyIcons(contentType) {

			// convert icons for composite content types
			iconHelper.formatContentTypeIcons(contentType.availableCompositeContentTypes);

			// make array to store contentType icon
			var contentTypeArray = [];

			// push icon to array
			contentTypeArray.push({"icon":contentType.icon});

			// run through icon method
			iconHelper.formatContentTypeIcons(contentTypeArray);

			// set icon back on contentType
			contentType.icon = contentTypeArray[0].icon;

		}

		function getDataTypeDetails(property) {

			if( property.propertyState !== "init" ) {

				dataTypeResource.getById(property.dataTypeId)
					.then(function(dataType) {
						property.dataTypeIcon = dataType.icon;
						property.dataTypeName = dataType.name;
					});
			}
		}


		/** Syncs the content type  to it's tree node - this occurs on first load and after saving */
		function syncTreeNode(dt, path, initialLoad) {

			navigationService.syncTree({ tree: "documenttype", path: path.split(","), forceReload: initialLoad !== true }).then(function (syncArgs) {
				vm.currentNode = syncArgs.node;
			});

		}

	}

	angular.module("umbraco").controller("Umbraco.Editors.DocumentType.EditController", DocumentTypeEditController);

})();
