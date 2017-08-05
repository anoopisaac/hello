function Generator() {};
Generator.prototype.rand =  Math.floor(Math.random() * 26) + Date.now();

Generator.prototype.getId = function() {
return this.rand++;
};

var idGen =new Generator();


var demo = angular.module("myApp", ["ui.bootstrap.modal"]);


demo.controller("Ctrl",

function Ctrl($scope,$http) {

    $scope.model = {
        
        selected: {}
    };


    // gets the template to ng-include for a table row / item
    $scope.getTemplate = function (task) {
        if (task.id === $scope.model.selected.id) return 'edit';
        else return 'display';
    };

 
  function fetchData() {
        // Simple GET request example :
		$http.get('/public/craiglist.txt').
		success(function(data, status, headers, config) {
		   
			$scope.model.tasks = data;
		    if (!$scope.$$phase) {
		        $scope.$apply();
		    }
		}).
		error(function(data, status, headers, config) {
		    // called asynchronously if an error occurs
		    // or server returns response with an error status.
		    console.log(status);
		});





    }   
    fetchData();    




});