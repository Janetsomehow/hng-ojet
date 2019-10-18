define([
  "ojs/ojcore",
  "knockout",
  "jquery",
  "./api",
  "ojs/ojarraydataprovider",
  "ojs/ojlabel",
  "ojs/ojlistview",
  "ojs/ojmodel",
  "ojs/ojdialog",
  "ojs/ojinputtext",
  "ojs/ojmessages"
], function(oj, ko, $, api, ArrayDataProvider) {
  function CategoryViewModel() {
    var self = this;

    self.categoryDataProvider = ko.observable(); //gets data for Categories list
    self.postsInCategory = ko.observable(); // gets data for posts under selected category
    self.categoryData = ko.observable(""); //holds data for the Category details
    self.newCategory = ko.observableArray([]); //newItem holds data for the create item dialog
    self.numOfPosts = ko.observableArray([]);

    // notification messages observable
    self.applicationMessages = ko.observableArray([]);
    // Activity selection observables
    self.categorySelected = ko.observable(false);
    self.firstSelectedCategory = ko.observable();

    //REST endpoint
    var RESTurl = `${api}/api/categories`;

    //User Token
    var userToken = sessionStorage.getItem("user_token");

    self.showCreateDialog = function(event) {
      document.getElementById("createDialog").open();
    };

    self.showEditDialog = function(event) {
      document.getElementById("editDialog").open();
    };
    self.showDeleteDialog = function(event) {
      document.getElementById("deleteDialog").open();
    };

    self.selectedCategoryChanged = function(event) {
      // Check whether click is a category selection or deselection
      if (event.detail.value.length != 0) {
        console.log(event.detail);
        // If selection, populate and display Category details
        // Populate items list observable using firstSelectedXxx API
        let { data } = self.firstSelectedCategory();
        if (data == null) {
          self.categorySelected(false);
        } else {
          self.posts_under_category(data.id);
          self.categoryData(data);
          self.categorySelected(true);
        }
      } else {
        // If deselection, hide list
        self.categorySelected(false);
      }
    };

    self.createCategory = function(event, data) {
      let title = self.newCategory.category_name;
      let description = self.newCategory.description;
      $.ajax({
        url: `${RESTurl}`,
        headers: {
          Authorization: "Bearer " + userToken
        },
        method: "POST",
        data: { title, description },
        success: () => {
          self.fetchCategories();
          self.applicationMessages.push({
            severity: "confirmation",
            summary: "Category created successfully"
          });
        },
        error: err => {
          console.log(err);
          self.applicationMessages.push({
            severity: "error",
            summary: "Error creating category",
            detail:
              "An error occured while trying to create category, please try again"
          });
        }
      });
      document.getElementById("createNewTitle").value = "";
      document.getElementById("createNewDesc").value = "";
      document.getElementById("createDialog").close();
    };

    self.fetchCategories = function() {
      $.ajax({
        url: `${RESTurl}`,
        headers: {
          Authorization: "Bearer " + userToken
        },
        method: "GET",
        success: res => {
          let { data } = res;
          self.categoryDataProvider(
            new ArrayDataProvider(data, {
              keys: data.map(function(value) {
                numberOfPosts(value.id);
                return value.id;
              })
            })
          );
        }
      });

      let numberOfPosts = category_id => {
        $.ajax({
          url: `${RESTurl}/posts/${category_id}`,
          method: "GET",
          headers: {
            Authorization: "Bearer " + userToken
          },
          success: resp => {
            let { data } = resp.data;
            self.numOfPosts()[`${category_id}`] = `${data.length}`;
            self.numOfPosts(self.numOfPosts());
          },
          error: err => console.log(err)
        });
      };
    };

    self.updateCategorySubmit = function(event) {
      var categoryId = self.categoryData().id;
      let title = self.categoryData().category_name;
      let description = self.categoryData().dsecription;
      $.ajax({
        url: `${RESTurl}/update/${categoryId}`,
        headers: {
          Authorization: "Bearer " + userToken
        },
        method: "POST",
        data: { title, description },
        success: res => {
          self.fetchCategories();
          self.categorySelected(false);

          // send a success message notification to the tracks view
          self.applicationMessages.push({
            severity: "confirmation",
            summary: "Category updated successfully"
          });
        },
        error: err => {
          console.log(err);
          // send an error message notification to the tracks view
          self.applicationMessages.push({
            severity: "error",
            summary: "Error updating category",
            detail:
              "An error occured on updating category"
          });
        }
      });
      document.getElementById("editDialog").close();
    };

    self.deleteCategory = function(event, data) {
      var categoryId = self.categoryData().id;
      $.ajax({
        url: `${RESTurl}/${categoryId}`,
        headers: {
          Authorization: "Bearer " + userToken
        },
        method: "DELETE",
        success: res => {
          self.fetchCategories();
          self.categorySelected(false);
          self.applicationMessages.push({
            severity: "confirmation",
            summary: "Category deleted"
          });
        },
        error: err => {
          console.log(err);
          self.applicationMessages.push({
            severity: "error",
            summary: "Error deleting category",
            detail: "An error occured while trying to delete category."
          });
        }
      });

      document.getElementById("deleteDialog").close();
    };

    self.posts_under_category = function(category_id) {
      $.ajax({
        url: `${RESTurl}/posts/${category_id}`,
        headers: {
          Authorization: "Bearer " + userToken
        },
        method: "GET",
        success: res => {
          let { data } = res.data;
          self.postsInCategory(
            new ArrayDataProvider(data, {
              keys: data.map(function(value) {
                return value.id;
              })
            })
          );
        }
      });
    };

    let pm = ko.dataFor(document.querySelector("#admin"));
    pm.selectedItem.subscribe(function() {
      if (pm.selectedItem() == "Categories") {
        console.log(pm.selectedItem());
        self.categorySelected(false);
        self.firstSelectedCategory({});
        self.fetchCategories();
      }
    });
  }

  return new CategoryViewModel();
});
