function Generator() {}
;
Generator.prototype.rand = Math.floor(Math.random() * 26) + Date.now();

Generator.prototype.getId = function() {
    return this.rand++;
}
;

var idGen = new Generator();


var demo = angular.module("myApp", ["ui.bootstrap.modal"]);

demo.directive('autofocusWhen', function($timeout) {
    return {
        link: function(scope, element, attrs) {
            scope.$watch(attrs.autofocusWhen, function(newValue) {
                if (newValue) {
                    $timeout(function() {
                        element.focus();
                    });
                }
            });
        }
    };
});


var priorityScale=['l','m','p'];


var Date1 = {
    
    parse: function(dateString) {
        var timeZoneString = "T00:00:00-0800";
        return new Date(dateString + timeZoneString);
    }
}

function isEmpty(string){
    return (typeof string == 'undefined'||string=="")
}

// filter method, creating `makeUppercase` a globally
// available filter in our `app` module
demo.filter('filterTask', function() {
    // function that's invoked each time Angular runs $digest()
    // pass in `item` which is the single Object we'll manipulate
    return function(tasks, scope) {
        var model=scope.model;
        if (model.allFilter && model.allFilter != "") {
            if (model.allFilter == "notdone") {
                tasks = _.filter(tasks, function(element) {
                    return element.status && element.status.startsWith("n")
                });
                return tasks;
            }
            return tasks;
        }
        /* if(model.allFilter){
      return;
    }*/
        if (model.dayFilter!='all') {
            var tillDate = new Date(Date.today().getTime()+(model.dayFilter*(24*60*60*1000)));
            tasks = _.filter(tasks, function(element) {
                return Date1.parse(element.dueDate).getTime() <= tillDate.getTime()
            });
        }
        if (model.typeFilter&&model.typeFilter!='all') {
            tasks = _.filter(tasks, function(element) {
                return element.type && element.type.startsWith(model.typeFilter)
            });
        }
        if (model.routeFilter) {
            if (model.routeFilter == "c" || model.routeFilter == "e" || model.routeFilter == "sc") {
                tasks = _.filter(tasks, function(element) {
                    return element.route && element.route.startsWith(model.routeFilter)
                });
            }
        
        }
        if (model.timeFilter) {
            if (model.timeFilter != "a" ) {
                tasks = _.filter(tasks, function(element) {
                    var timeLeft=scope.getTimeLeft(element)
                    return timeLeft <= parseInt(model.timeFilter*60)
                });
            }
        
        }
        if (model.statusFilter) {
            tasks = _.filter(tasks, function(element) {
                return element.status && element.status.startsWith("n")
            });
        }

        tasks = _.filter(tasks, function(element) {

                var success=false;
                success=success|| (model.lowPriority&& element.priority && element.priority.startsWith("l"))
                success=success|| (model.mediumPriority&& element.priority && element.priority.startsWith("m"))
                success=success|| (model.highPriority&& element.priority && element.priority.startsWith("p"))
                return success;
                
        });

        if (model.criticalFilter) {
            tasks = _.filter(tasks, function(element) {
                return !isEmpty(element.critical)&&element.critical==true
            });
        }
        if (model.markedFilter) {
            tasks = _.filter(tasks, function(element) {
                return !isEmpty(element.marked)&&element.marked==true
            });
        }
        if (model.tagFilter && model.tagFilter.trim() != "") {
            tasks = _.filter(tasks, function(element) {
                if (isEmpty(element.tags))
                    element.tags="";
                var returnValue = true;
                $.each(model.tagFilter.split(","), function(index, value) {
                    var perTagReturnValue=true;
                    if(value.length==0||(value.startsWith("!")&&value.length==1)) return;
                    perTagReturnValue=value.startsWith("!")?element.tags.indexOf(value.substring(1)) > -1:element.tags.indexOf(value) > -1
                    perTagReturnValue=value.startsWith("!")?!perTagReturnValue:perTagReturnValue;
                    returnValue = returnValue && perTagReturnValue;
                })
                return returnValue;
            });
        
        }
        if (model.textFilter && model.textFilter.trim() != "") {
            tasks = _.filter(tasks, function(element) {

               return (element.task.indexOf(model.textFilter)>-1 ||element.dueDate.indexOf(model.textFilter) >-1 ||element.maxDate.indexOf(model.textFilter) >-1||element.status.indexOf(model.textFilter) >-1)
            });
        
        }

         
        model.filteredTasks = tasks;
        // return the current `item`, but call `toUpperCase()` on it
        return tasks;
    }
    ;
});


demo.controller("Ctrl", 

function Ctrl($scope, $http,$timeout) {
    
    //setting the initial order
    
    var fireBaseUrl = "https://checkmyday.firebaseio.com/taskList/";
    var fireRef = new Firebase(fireBaseUrl);
    var currentTaskRef = fireRef.child("regular");
    /* jQuery(document).on('keypress', function(e){
        if ( e.which == 13 &&$scope.model.selected.task) {
          $scope.$apply($scope.saveTask($scope.model.selected.id));
          //e.preventDefault();
        }
         
    });*/

   $('.root').on("click", ".task table tr", function() {
        var selectedId=this.getAttribute("id");
        var index=0;
        var task = _.filter($scope.model.filteredTasks, function(task) {
            return task.fireId == selectedId;
        });
        $scope.model.focusIndex=$scope.model.filteredTasks.indexOf(task[0]);

        if (!$scope.$$phase) {
            $scope.$apply();
        }
   });

    angular.element(window).on('keydown', function(e) {
    	

       /* if (e.ctrlKey && e.keyCode == 13 && !$scope.model.selected.task) {
            // Ctrl-Enter pressed
            var task=$scope.model.filteredTasks[$scope.model.focusIndex];
            task.datechanged=true;
            $scope.incrementDueDate(task, 1);
            $timeout(function(){
                $scope.model.focusIndex= $scope.model.filteredTasks.indexOf(task);
                alignScrollBar($scope)
                console.log("Running after the digest cycle");
            },0,true);

            if (!$scope.$$phase) {
                $scope.$apply();
            }
           
            return;
        }*/
        
        if (e.ctrlKey && e.keyCode == 80 && !$scope.model.selected.task) {
            e.preventDefault();
            // Ctrl-P pressed for changing priority
            $scope.changePriority($scope.model.filteredTasks[$scope.model.focusIndex]);
            
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            
            return;
        }

        // going  to saved task on alt left arrow
        if (e.altKey && e.keyCode == 37) {
            e.preventDefault();
            // Ctrl-P pressed for changing priority
            alignScrollBar($scope,$scope.model.lastSavedIndex);
            
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            
            return;
        }
        
        
        if (e.ctrlKey && e.keyCode == 83) {
            e.preventDefault();
            // Ctrl-S pressed, for saving tasks
            $scope.saveAll();
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            
            return;
        }



        //presseing alt P for toggling priority button
        if (e.altKey && e.keyCode == 80) {
            e.preventDefault();
           	$scope.model.priorityFilter=$scope.model.priorityFilter?false:true;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        //ctrl m - to mark specific ones
        if (e.ctrlKey && e.keyCode == 77) {
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                task.marked=isEmpty(task.marked)?true:false;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }
  

        //ctrl d - to increment date
        if (e.ctrlKey && e.keyCode == 68) {
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var day=1;
                if(e.shiftKey){
                    day=day*-1;
                }
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                $scope.model.selected.dueDate=Date1.parse($scope.model.selected.dueDate).add(day).days().toString("yyyy-MM-dd");
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }


        //ctrl h - to highlight specific ones
        if (e.ctrlKey && e.keyCode == 72) {
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                task.critical=isEmpty(task.critical)?true:false;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        //left right for changing time left to do
        if (e.keyCode == 37||e.keyCode == 39) {
            var currenTimeInMillis=new Date().getTime();
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                task.taskTime=(typeof task.taskTime != 'undefined')?e.keyCode==39?(task.taskTime+(20*60*1000)):(task.taskTime-(20*60*1000)):currenTimeInMillis;
                task.taskTime=task.taskTime<currenTimeInMillis?currenTimeInMillis:task.taskTime;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }


         //for changing the order 
        if (e.ctrlKey && (e.keyCode == 38||e.keyCode == 40)&&($scope.predicate=='order')) {
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                if(e.keyCode == 38){
                    $scope.moveUp(task)
                    alignScrollBar($scope)
                }
                else{
                    $scope.moveDown(task)
                    alignScrollBar($scope)
                }
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            return;
        }

        if (e.ctrlKey && (e.keyCode == 36)&&($scope.predicate=='order')) {
            e.preventDefault();
            if (typeof $scope.model.focusIndex != 'undefined') {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                if(e.keyCode == 36){
                    $scope.moveUp(task,true)
                    alignScrollBar($scope)
                }
               
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            return;
        }
        
        //to cancel the edit when escape is pressed
        if (e.which == 27) {
            e.preventDefault();
            if ($scope.model.selected.task) {
                var task=$scope.model.filteredTasks[$scope.model.focusIndex];
                var editTaskIndex=$scope.model.filteredTasks.indexOf(task);
                $scope.cancelTask(task,editTaskIndex);
            } 
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            //e.preventDefault();
        }

        
        //enter pressed
        if (e.which == 13) {
            if ($scope.model.selected.task) {
                $scope.saveTask($scope.model.selected.id);
            
            } 
            else if (typeof $scope.model.focusIndex != 'undefined') {
                $scope.editTask($scope.model.filteredTasks[$scope.model.focusIndex]);
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            //e.preventDefault();
        }
        
        
        
        if (e.which == 38) {
            alignHighlighting($scope,'up')
            alignScrollBar($scope)
        }
        if (e.which == 40) {
           alignHighlighting($scope,'down')
           alignScrollBar($scope)
        }
    });
    
    function alignHighlighting($scope,direction){
        if (typeof $scope.model.focusIndex == 'undefined') {
            $scope.model.focusIndex = direction=='up'?$scope.model.filteredTasks.length - 1:0;
        } 
        else {
            if(direction=='up'){
                if ($scope.model.focusIndex > 0)
                    $scope.model.focusIndex--;
            }
            else{
                if ($scope.model.focusIndex < ($scope.model.filteredTasks.length - 1))
                    $scope.model.focusIndex++;
            }
           

        }
    }

    function alignScrollBar($scope,scrollIndex){
        var scrollTask;
        
        if(!scrollIndex){
            scrollIndex=$scope.model.focusIndex;
        }
        scrollTask=$scope.model.filteredTasks[scrollIndex];

        $("body").animate({scrollTop: $("#"+scrollTask.fireId).offset().top-500}, "fast");
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }
    
    $scope.open = function() {
        $scope.showModal = true;
    }
    ;
    
    $scope.ok = function() {
        $scope.showModal = false;
    }
    ;
    
    $scope.cancel = function() {
        $scope.showModal = false;
    }
    ;
    
    
    $scope.model = {
        
        selected: {},
        currenttime: {
            height: 100,
            width: 100,
            x: 0,
            y: 0
        },
        showNote: false,
        selected: {},
        tasks: []
    };
    
    $scope.changeTaskListType = function(taskListType) {
        
        currentTaskRef = fireRef.child(taskListType);
        if (currentTaskRef.path.o[currentTaskRef.path.o.length - 1] == "regular") {
            $scope.model.todayFilter=true;
        }
        else{
            $scope.model.todayFilter=false;
        }
        
        $scope.fetchData();
    }
    
    $scope.getPriorityNumber = function(task) {
        return (!isEmpty(task) &&task.priority=='p') ? 0: 1;
    
    }

    $scope.getDisplayPriority = function(task) {
        return (task.priority == 'undefined' || task.priority.trim().length == 0) ? "nothing" : task.priority.replace(/^m/, "medium").replace(/^p/, "higher").replace(/^l/, "low")
    
    }
    
    // gets the template to ng-include for a table row / item
    $scope.getTemplate = function(task) {
        if (task.id === $scope.model.selected.id)
            return 'edit';
        else
            return 'display';
    }
    ;
    $scope.hideFilter = true;
    $scope.editTask = function(task) {
        $scope.model.selected = angular.copy(task);
        //$scope.model.selected.type="personal";
        $scope.hideFilter = false;
        $scope.model.selected.taskIndex = $scope.model.tasks.indexOf(task);
        $scope.model.selected.timeLeft=$scope.getTimeLeft(task);
    }
    ;
    
    //for printing how delayed is the task
    $scope.getTaskTimeDisplayString=function(task){

        var taskTime=(isEmpty(task.taskTime)||(task.taskTime<new Date().getTime()))?new Date().getTime():task.taskTime;
        var taskDate=new Date(taskTime);
        return taskDate.getHours()+":"+taskDate.getMinutes();
    }

    //for printing how delayed is the task
    $scope.getTimeLeft=function(task){
        var timeLeft =(isEmpty(task.taskTime))?0:parseInt((task.taskTime- (new Date().getTime()))/(60*1000))
        timeLeft=timeLeft<0?0:timeLeft;
        return timeLeft;
    }
    //get time left class name
    $scope.getTimeLeftClass=function(task){
        var minutesLeft=$scope.getTimeLeft(task);
        var className="blue";
        switch(minutesLeft) {
            case minutesLeft<60:
                className="red"
                break;
            case minutesLeft<120:
                className="lightred"
                break;
            case minutesLeft<240:
                className="lightblue"
                break;
            default:
                className="blue"
        }
        return className;
    }

    $scope.saveTask = function(id) {
        
        
        if (!Date1.parse($scope.model.selected.dueDate) || !Date1.parse($scope.model.selected.maxDate)) {
            alert("please enter proper date");
            return;
        }
        $scope.model.selected.maxDate=$scope.model.selected.dueDate
        // if (Date1.parse($scope.model.selected.dueDate).getTime() > Date1.parse($scope.model.selected.maxDate).getTime()) {
        //     alert("max date should be >= than due date");
        //     return;
        // }
        //ng-model="model.selected.task" 
        var task = _.filter($scope.model.tasks, function(task) {
            return task.id == id;
        });
        //console.log("fire id::" + task[0].fireId);
        
        
        $scope.model.savedTaskIndex = $scope.model.filteredTasks.indexOf(task);
        $scope.model.prevFocusIndex=$scope.model.savedTaskIndex;
        var duration = $scope.model.selected.duration;
        $scope.model.selected.duration = parseInt(duration);
        $scope.model.selected.order = parseFloat($scope.model.selected.order);
        $scope.model.selected.taskTime=parseInt($scope.model.selected.timeLeft)+(new Date().getTime());
        angular.copy($scope.model.selected, task[0]);
        $scope.reset();
        //$scope.saveAll();
        $scope.model.lastSavedTask = task[0].task;
        $scope.model.saveMessage="Save is done....."+new Date().toString("HH:mm:ss");;
        var fireTask = angular.copy(task[0]);
        task[0].datechanged=false;
        if (fireTask.fireId) {
            var taskRef = currentTaskRef.child(fireTask.fireId);
            taskRef.update(fireTask);
        } 
        else {
            //should be a new one
            var newTask = currentTaskRef.push(fireTask);
            task[0].fireId = newTask.key();
        }

        $timeout(function(){
            $scope.model.lastSavedIndex= $scope.model.filteredTasks.indexOf(task[0]);
            task[0].datechanged=true;
            //alignScrollBar($scope)
            console.log("Running after the digest cycle");
        },0,true);
    
    }

    $scope.cancelTask=function(task,index){
        if(task&&isEmpty(task.fireId)){
            $scope.model.tasks.splice(index, 1);
        }
        $scope.reset();
    }
    ;
    
    $scope.reset = function() {
      
        $scope.model.selected = {};
        $scope.hideFilter = true;
    }
    ;
    
    //days to check the time used up
    $scope.model.daysToDisplay = [];
    
    $scope.daysToDisplay = 5;
    for (var i = 0; i <= $scope.daysToDisplay; i++) {
        var today = Date.today();
        today.add(i).days();
        $scope.model.daysToDisplay.push(today);
    
    }
    
    
    
    $scope.getTimeString = function(date) {
        var dayTasks = getTask($scope.model.tasks, date)
        var offTasks = _.filter(dayTasks, function(task) {
            return task.type && task.type.startsWith("o");
        });
        var totOffTime = _.reduce(offTasks, function(memo, task) {
            return memo + task.duration
        }, 0);
        
        var perTasks = _.filter(dayTasks, function(task) {
            return task.type && task.type.startsWith("p");
        });
        var totPerTime = _.reduce(perTasks, function(memo, task) {
            return memo + task.duration
        }, 0);
        
        return "Official:" + totOffTime + " Personal:" + totPerTime;
    }
    
    
    
    
    $scope.addRow = function() {
        firstTask=$scope.model.filteredTasks[0];
        var task = {
            id: new Date().getTime(),
            task: 'Empty',
            priority: $scope.model.highPriority?"p":"m",
            type:$scope.model.typeFilter=="o"?"official":"personal",
            duration: 20,
            order:parseFloat(firstTask.order/2),
            taskTime:new Date().getTime(),
            dueDate: new Date().toString('yyyy-MM-dd'),
            maxDate: new Date().toString('yyyy-MM-dd'),
            status: 'notdone'
        };
        $scope.model.tasks.unshift(task);
        $scope.editTask(task);
    }
    ;

    $scope.searchTask = function() {
        var searchResults = _.filter($scope.model.tasks, function(element) {
            var regexSearch=new RegExp(".*"+$scope.model.taskSearch+".*","i")
            if(regexSearch.test(element.task)){
                return true;
            }
            if(regexSearch.test(element.tags)){
                return true;
            }
        });
        $scope.model.searchResults=_.sortBy(searchResults, 'status').reverse();
       
    }
    
    $scope.remove = function(task) {
        var isDelete = confirm("Do you really want to remove:" + task.task + "?");
        if (!isDelete) {
            return;
        }
        $scope.model.tasks = _.filter($scope.model.tasks, function(element) {
            return element.id != task.id;
        });
        var deleteTask = currentTaskRef.child(task.fireId)
        //trying to delete here
        deleteTask.update({
            status: "removed"
        });
        
        $scope.model.lastSavedTask = task;
    
    }
    ;
    
    $scope.minutesPerDay = 360;
    $scope.tasksPerDay = 6;
    $scope.daysToConsider = 15;
    $scope.reAssign = function() {
        //$scope.handleOldTasks();
        reAssignDates($scope.model.tasks);
        //var dayTasks=getTask($scope.model.tasks,Date.today());
    }
    
    $scope.moveUp = function(task,toTop) {
        var index=$scope.model.filteredTasks.indexOf(task);

        if(toTop&&toTop==true){
            var topOrder=$scope.model.filteredTasks[0].order;
            task.order=topOrder/2;
             $scope.model.focusIndex=0;
             return;
        }
        else if(index==1){
            var adjacentOrder=$scope.model.filteredTasks[0].order;
            task.order=adjacentOrder/2
        }
        else if(index>1){
            var adjacentOrder=$scope.model.filteredTasks[index-1].order;
            var theOtherOrder=$scope.model.filteredTasks[index-2].order;
            task.order=adjacentOrder-((adjacentOrder-theOtherOrder)/2)
        }
        
        $scope.model.focusIndex = index==0?index:--index;
        createNewOrder();
        
     
    }
   

    $scope.moveDown = function(task) {
        var index=$scope.model.filteredTasks.indexOf(task);
        if(index==($scope.model.filteredTasks.length-2)){
            var adjacentOrder=$scope.model.filteredTasks[$scope.model.filteredTasks.length-1].order;
            task.order=adjacentOrder+10;
        }
        else if(index<($scope.model.filteredTasks.length-2)){
            var adjacentOrder=$scope.model.filteredTasks[index+1].order;
            var theOtherOrder=$scope.model.filteredTasks[index+2].order;
            task.order=adjacentOrder+((theOtherOrder-adjacentOrder)/2)
        }
        $scope.model.focusIndex = index==($scope.model.filteredTasks.length-1)?index:++index;
        createNewOrder();
    }

    function createNewOrder(){
        var newOrder=1;
        var newOrderedTask=$scope.model.filteredTasks.sort(function (a, b) {
            dateCompare=Date1.parse(a.dueDate).getTime()-Date1.parse(b.dueDate).getTime();
            return (dateCompare>0?1:(dateCompare<0?-1:(a.order > b.order ? 1 : -1)));
        })
        newOrderedTask.filter(function(a){
            a.order=newOrder++;
        })
    }
  
    $scope.incrementDueDate = function(task, days) {
        //T00:00:00-0700
        task.dueDate = Date1.parse(task.dueDate).add(days).days().toString("yyyy-MM-dd");
        if(Date1.parse(task.dueDate).getTime()>=Date1.parse(task.maxDate).getTime()){
            task.maxDate=task.dueDate;
        }
    
    }
    $scope.incrementDuration = function(task, duration) {
        
        task.duration = task.duration + (duration);
    }
    
    $scope.incrementMaxDate = function(task, days) {
        task.maxDate = Date1.parse(task.maxDate).add(days).days().toString("yyyy-MM-dd");
    
    }
    
    $scope.changeStatus = function(task) {
        var statuses = ['notdone', 'done']
        
        var index = jQuery.inArray(_.filter(statuses, function(element) {
            return element.startsWith(task.status.charAt(0))
        })[0], statuses);
        task.status = statuses[index == 0 ? 1 : 0];
    
    }
    
    $scope.changePriority = function(task) {
        var priorities = ['p', 'm', 'l']
        
        var index = jQuery.inArray(_.filter(priorities, function(element) {
            return element == task.priority
        })[0], priorities);
        console.log(index);
        index = [(++index) % 3];
        console.log(index);
        task.priority = priorities[index];
    
    }
    
    $scope.changeType = function(task) {
        var types = ['official', 'personal']
        
        if (task.type) {
            
            var index = jQuery.inArray(_.filter(types, function(element) {
                return element.startsWith(task.type.charAt(0))
            })[0], types);
            task.type = types[index == 0 ? 1 : 0];
        } 
        else {
            task.type = types[0];
        }
    
    
    
    
    }
    
    //go through the dates and push the task to the next day, if it has time left
    
    function reAssignDates(tasks) {
        
        for (var i = 0; i <= $scope.daysToConsider; i++) {
            var today = Date.today();
            var analysisDate = today.add(i).days();
            //see whether we have lower priority task for the day
            var lowerTasks = getLowerPriorityTasks(analysisDate, tasks);
            //filter out the one with < 10 mins of task duration
            //lowerTasks = filterOutLessDurationTasks(lowerTasks, 10);
            _.each(lowerTasks, function(lowerTask) {
                
                //var totalTime = getTotalTime(analysisDate);
                var totalTaks=getTotalTasks(analysisDate)
                if (totalTaks > $scope.tasksPerDay) {
                    lowerTask.dueDate = Date1.parse(lowerTask.dueDate).add(1).days().toString("yyyy-MM-dd");
                }
            
            });
        
        }
    }
    
    function getLowerPriorityTasks(analysisDate, tasks) {
        var lowerTasks = _.filter(tasks, function(element) {
            return (Date1.parse(element.dueDate).getTime() == analysisDate.getTime()) && (Date1.parse(element.maxDate).getTime() > analysisDate.getTime())
        });
        return _.sortBy(lowerTasks, 'maxDate').reverse()
    
    }
    //filter out the one with lesser duration from lower priority ones, so that those tasks are postponded.
    function filterOutLessDurationTasks(lowerTasks, duration) {
        var lowerTasks = _.filter(lowerTasks, function(element) {
            // if no duration defined , these are considered lower priority ones.
            if (!element.duration) {
                return true;
            }
            //all the tasks with greater duration are lower priority ones.
            return ( element.duration > duration) 
        });
        return lowerTasks;
    
    }
    
    function getTotalTime(day) {
        var daysTasks = getTask($scope.model.tasks, day);
        var totalTime = 0;
        _.each(daysTasks, function(task) {
            totalTime += parseInt(task.duration);
        });
        return totalTime;
    }

    function getTotalTasks(day) {
        var daysTasks = getTask($scope.model.tasks, day);
        return daysTasks.length;
    }
    
    
    function getTask(tasks, date) {
        var dayTasks = []
        
        dayTasks = _.filter(tasks, function(element) {
            return element.dueDate == date.toString("yyyy-MM-dd") && element.status.startsWith("n")
        });
        return dayTasks;
    }
    
    $scope.handleOldTasks = function() {
        var today = Date.today();
        oldTasks = _.filter($scope.model.tasks, function(element) {
            if (!element.status) {
                console.log(element);
            }
            //return Date1.parse(element.dueDate).getTime() < today.getTime() && element.status.startsWith("n")
        });
        _.each(oldTasks, function(task) {
            task.dueDate = today.toString("yyyy-MM-dd");
        });
        
        oldTasks = _.filter($scope.model.tasks, function(element) {
            return Date1.parse(element.maxDate).getTime() < today.getTime() && element.status.startsWith("n")
        });
        _.each(oldTasks, function(task) {
            task.maxDate = today.toString("yyyy-MM-dd");
        });
    }
    
    $scope.moveMarkedTop=function(){
         _.each($scope.model.tasks, function(task) {
            if(!isEmpty(task.priority)&&task.priority=='p'){
                $scope.moveUp(task,true);
            }
         });

    }
     $scope.saveAll = function() {
        var updateTask = {};
        _.each($scope.model.tasks, function(task) {

            updateTask[task.fireId + "/dueDate"] = task.dueDate;
            updateTask[task.fireId + "/maxDate"] = task.maxDate;
            updateTask[task.fireId + "/status"] = task.status;
            updateTask[task.fireId + "/priority"] = task.priority?task.priority:"l";
            updateTask[task.fireId + "/type"] = task.type?task.type:"official";task
            updateTask[task.fireId + "/order"] = (typeof task.order == 'undefined')?0:task.order;
            updateTask[task.fireId + "/taskTime"] = (typeof task.taskTime == 'undefined' || task.taskTime<=0)?new Date().getTime():task.taskTime;
            updateTask[task.fireId + "/critical"] = isEmpty(task.critical)?false:task.critical;
            updateTask[task.fireId + "/marked"] = isEmpty(task.marked)?false:task.marked;
            
            if(task.tags){
              updateTask[task.fireId + "/tags"] = task.tags;
            }
            
            //console.log(task.fireId+" wee "+task.task);
        });
        currentTaskRef.update(updateTask)
        $scope.model.saveMessage="Save all is done....."+new Date().toString("HH:mm:ss");
    }
    ;
    
    
    /*$scope.saveAll = function() {
         _.each($scope.model.tasks, function (task) {
           if(!task.id){
                task.id=idGen.getId();
           }
        });
        // Simple POST request example (passing data) :
        $http.post('/public/saveAll', $scope.model.tasks).       
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            console.log(data);
            $scope.model.saveMessage="Data saved:"+ (new Date().toString("MMM,dd HH:mm"))
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log(data);
            alert("error while saving data!!");
        });
    };*/
    
    
    
    $scope.fetchData = function() {
        
        
        $scope.model.fetchinfo="..in progress...."
        // Attach an asynchronous callback to read the data at our posts reference
        currentTaskRef.once("value", function(snapshot) {
            $scope.model.tasks.length = 0
            var tasks = snapshot.val();
            for (key in tasks) {
                
                var modelTasks = $scope.model.tasks;
                
                var task = tasks[key];
                if (task.status == "removed") {
                    continue;
                }
                task.duration = parseInt(task.duration);
                task.fireId = key;
                modelTasks.push(task);
                task.type=(!task.type)?"official":task.type.startsWith("o")?"official":"personal"
                
                if (currentTaskRef.path.o[currentTaskRef.path.o.length - 1] == "regular") {
                    var today = Date.today();
                    if (Date1.parse(task.dueDate).getTime() < today.getTime() && task.status.startsWith("n")) {
                        task.dueDate = today.toString("yyyy-MM-dd");
                    }
                    
                    
                    if (Date1.parse(task.maxDate).getTime() < today.getTime() && task.status.startsWith("n")) {
                        task.maxDate = today.toString("yyyy-MM-dd");
                    }

                    if(Date1.parse(task.dueDate).getTime()>=Date1.parse(task.maxDate).getTime()){
                        task.maxDate=task.dueDate;
                    }

                }
            
            }
            //console.log("after::" + new Date().getTime())
            $scope.model.fetchinfo="..done"
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            
            $timeout(function(){
                $scope.model.fetchinfo="";
            },5000,true);
            //$scope.moveMarkedTop();
        }, function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
     
    }
    //all the calls to properly display the task
    $scope.fetchData();
    $scope.reAssign();
    $scope.predicate='order'



});
