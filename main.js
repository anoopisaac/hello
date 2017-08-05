var app = angular.module('myApp', ['ngGrid','ui.bootstrap']);

app.directive('bindOnce', function() {
    return {
        scope: true,
        link: function( $scope ) {
            setTimeout(function() {
                $scope.$destroy();
            }, 0);
        }
    };
});


function Generator() {};
Generator.prototype.rand =  Math.floor(Math.random() * 26) + Date.now();

Generator.prototype.getId = function() {
return this.rand++;
};

var idGen =new Generator();

app.controller('MyCtrl', function($scope,$http) {
    
    $scope.filterOptions = {
        filterText: 'notdone'
    };

    $( "body" ).on( "click", ".datepicker", function() {
       $(this).datepicker({showOn:'focus' }).focus();
    });


    $scope.statuses = {'done': 'done', 'notdone': 'notdone'};
    $scope.types = {'personal': 'personal', 'official': 'official'};
    $scope.cellSelectEditableTemplate = '<select ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-options="id as name for (id, name) in statuses" ng-blur="updateEntity(row)" />';
    $scope.typeEditableTemplate = '<select ng-class="\'colt\' + col.index" ng-input="COL_FIELD" ng-model="COL_FIELD" ng-options="id as name for (id, name) in types" ng-blur="updateEntity(row)" />';

    $scope.myTaskEditTemplate = '<input  type="date" class="datepicker" ng-input="COL_FIELD" ng-model="COL_FIELD"  />';
    $scope.myDateTemplate = '<input  type="date" class="datepicker" ng-input="COL_FIELD" ng-model="COL_FIELD"  />';
    $scope.priorityTemplate='<div class="ngCellText" ng-class="{\'red\' : row.getProperty(\'priority\') }"><input type="checkbox" ng-input="COL_FIELD" ng-model="COL_FIELD" ></div>';
    //'<div class="ngCellText" ng-class="{\'green\' : row.getProperty(\'alert\') == \'true\' }">{{ row.getProperty(col.field) }}</div>'
    //$scope.myDateTemplate='<input type="text" class="form-control"  ng-model="COL_FIELD" is-open="opened"  datepicker-options="dateOptions" date-disabled="disabled(date, mode)" ng-required="true" close-text="Close" />'
    $scope.mySelections = [];
    $scope.gridOptions = {
        data: 'myData',
        showColumnMenu: true,
        enableCellSelection: true,
        enableCellEdit: true,   
        showSelectionCheckbox: true,
        selectWithCheckboxOnly: true,
        selectedItems: $scope.mySelections,
        filterOptions: $scope.filterOptions,
        columnDefs: [
                     {field: 'task', displayName: 'Task', enableCellEdit: true,width:900}, 
                     {field:'duration', displayName:'Duration', enableCellEdit: true,width:100}, 
                     { field: 'dueDate', displayName: 'Due Date',  editableCellTemplate : $scope.myDateTemplate ,width:150}, 
                     { field: 'maxDate', displayName: 'Max Date',  editableCellTemplate : $scope.myDateTemplate ,width:150}, 
                     { field: 'status', displayName: 'Status', editableCellTemplate : $scope.cellSelectEditableTemplate ,width:100}, 
                     { field: 'type', displayName: 'Type', editableCellTemplate : $scope.typeEditableTemplate ,width:100},
                     { field: 'priority', displayName: 'Priority', cellTemplate : $scope.priorityTemplate ,width:80} 
                     ]

        
    };



    $scope.myData = '';

   

    $scope.addRow = function() {
        $scope.myData.unshift({id:new Date().getTime(),task: 'Empty', duration: 20,dueDate: new Date().toString('yyyy-MM-dd'),maxDate: new Date().toString('yyyy-MM-dd'),status:'notdone'});
    };

    $scope.remove = function () {
        _.each($scope.mySelections, function (task) {
            //Real remove (i.e from datastore)
            $scope.myData = _.filter($scope.myData, function(element){ return element.id != task.id;});
        });
       $scope.mySelections.splice(0, $scope.mySelections.length);
    };  

    $scope.minutesPerDay=360;
    $scope.daysToConsider=15;
    $scope.reAssign= function () {
        $scope.handleOldTasks();
        reAssignDates($scope.myData);
        //var dayTasks=getTask($scope.myData,Date.today());
    }

    function reAssignDates(tasks){
        var today=Date.today();
        for (var i = 0; i <= $scope.daysToConsider; i++) {
            var analysisDate=today.add(i).days();
           
            var lowerTasks= getLowerPriorityTasks(analysisDate,tasks);
            _.each(lowerTasks, function (lowerTask) {
                
                var totalTime=getTotalTime(analysisDate);
                if(totalTime>$scope.minutesPerDay){
                    lowerTask.dueDate=Date.parse(lowerTask.dueDate).add(1).days().toString("yyyy-MM-dd");
                }
                
            });
           
        }
    }

    function getLowerPriorityTasks(analysisDate,tasks){
        var lowerTasks= _.filter(tasks, function(element){ 
            return (Date.parse(element.dueDate).getTime()== analysisDate.getTime()) && (Date.parse(element.maxDate).getTime() > analysisDate.getTime()) 
        });
        return _.sortBy(lowerTasks, 'maxDate').reverse()
        
    }

    function getTotalTime(day){
        var daysTasks=getTask($scope.myData,day);
        var totalTime=0;
        _.each(daysTasks, function (task) {
           totalTime+=parseInt(task.duration);
        });
        return totalTime;
    }


    function getTask(tasks,date){
        var dayTasks=[]
        dayTasks = _.filter(tasks, function(element){ return Date.parse(element.dueDate).getTime() == date.getTime()});
        return dayTasks;
    }

    $scope.handleOldTasks= function () {
        var today=Date.today();
        oldTasks = _.filter($scope.myData, function(element){ return Date.parse(element.dueDate).getTime() < today.getTime()});
        _.each(oldTasks, function (task) {
           task.dueDate=today.toString("yyyy-MM-dd");
        });

        oldTasks = _.filter($scope.myData, function(element){ return Date.parse(element.maxDate).getTime() < today.getTime()});
        _.each(oldTasks, function (task) {
           task.maxDate=today.toString("yyyy-MM-dd");
        });
    }



    $scope.saveAll = function() {
         _.each($scope.myData, function (task) {
           if(!task.id){
                task.id=idGen.getId();
           }
        });
        // Simple POST request example (passing data) :
        $http.post('/public/saveAll', $scope.myData).       
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            console.log(data);
            alert("saved data!!");
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log(data);
            alert("error while saving data!!");
        });
    };

    
    function fetchData() {
        /*setTimeout(function(){  
            $http({
                url:'grid.html',
                type:'GET'})
                .success(function(data) {
                    $scope.myData = data;   
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }                   
                });         
        }, 300);    */


        // Simple GET request example :
        $http.get('/public/mytask.json').
          success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            console.log(status);
            $scope.myData = data;   
            if (!$scope.$$phase) {
                $scope.$apply();
            }   
          }).
          error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log(status);
          });   


           // Simple GET request example :
        $http.get('/public/crontask.json').
          success(function(data, status, headers, config) {
            console.log(status);
            var re = /\n/;
            var cronTasks=data.split(re);
            _.each(cronTasks, function (task) {
               if(needsToday(task)){
                    var task={id:new Date().getTime(),task: task.split("@")[1], duration: 20,dueDate: new Date().toString('yyyy-MM-dd'),maxDate: new Date().toString('yyyy-MM-dd'),status:'notdone',type:"personal",priority:true};
                    setTimeout(function(){
                        $scope.myData.push(task);
                    },1000);
                    

                }
            });
          }).
          error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log(status);
          });   


    }   
    fetchData();    


    $scope.myData = [{ name: "Moroni", age: 50, birthday: "Oct 28, 1970", salary: "60,000" },
                    { name: "Tiancum", age: 43, birthday: "Feb 12, 1985", salary: "70,000" },
                    { name: "Jacob", age: 27, birthday: "Aug 23, 1983", salary: "50,000" },
                    { name: "Nephi", age: 29, birthday: "May 31, 2010", salary: "40,000" },
                    { name: "Enos", age: 34, birthday: "Aug 3, 2008", salary: "30,000" },
                    { name: "Moroni", age: 50, birthday: "Oct 28, 1970", salary: "60,000" },
                    { name: "Tiancum", age: 43, birthday: "Feb 12, 1985", salary: "70,000" },
                    { name: "Jacob", age: 27, birthday: "Aug 23, 1983", salary: "40,000" },
                    { name: "Nephi", age: 29, birthday: "May 31, 2010", salary: "50,000" },
                    { name: "Enos", age: 34, birthday: "Aug 3, 2008", salary: "30,000" },
                    { name: "Moroni", age: 50, birthday: "Oct 28, 1970", salary: "60,000" },
                    { name: "Tiancum", age: 43, birthday: "Feb 12, 1985", salary: "70,000" },
                    { name: "Jacob", age: 27, birthday: "Aug 23, 1983", salary: "40,000" },
                    { name: "Nephi", age: 29, birthday: "May 31, 2010", salary: "50,000" },
                    { name: "Enos", age: 34, birthday: "Aug 3, 2008", salary: "30,000" }];
});