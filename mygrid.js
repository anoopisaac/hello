var app = angular.module('myApp', ['ui.grid', 'ui.grid.edit']);

app.controller('MyCtrl', ['$scope', function($scope) {
  $scope.myData = [{name: "Moroni", dob: '1985-01-01'},
                 {name: "Tiancum", dob: '1956-11-21'},
                 {name: "Jacob", dob: '1980-03-08'},
                 {name: "Nephi", dob: '1974-08-08'},
                 {name: "Enos", dob: '1991-07-17'}];

  $scope.gridOptions = {
    data: 'myData',
    // rowTemplate: '<div ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}" style="overflow: visible"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>',
    columnDefs: [
      {
        name: 'dob',
        displayName: 'DOB',
        cellFilter: 'date',
        type: 'date'

      },
      { name: 'name' , displayName: 'Name'}
    ]
  }
}]);