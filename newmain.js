function Generator() {};
Generator.prototype.rand =  Math.floor(Math.random() * 26) + Date.now();

Generator.prototype.getId = function() {
return this.rand++;
};

var idGen =new Generator();


var demo = angular.module("myApp", ["ui.bootstrap.modal"]);

demo.directive('autofocusWhen', function ($timeout) {
    return {
        link: function(scope, element, attrs) {
            scope.$watch(attrs.autofocusWhen, function(newValue){
                if ( newValue ) {
                    $timeout(function(){
                        element.focus();
                    });
                }
            });
        }
     };
});



var Date1 = {

    parse : function (dateString) {
      var timeZoneString="T00:00:00-0800";
      return new Date(dateString+timeZoneString);
    }
}

// filter method, creating `makeUppercase` a globally
// available filter in our `app` module
demo.filter('filterTask', function () {
  // function that's invoked each time Angular runs $digest()
  // pass in `item` which is the single Object we'll manipulate
  return function (tasks,model) {
    if(model.allFilter&&model.allFilter!=""){
      if(model.allFilter=="notdone"){
        tasks = _.filter(tasks, function(element){ return element.status&&element.status.startsWith("n")});
        return tasks;
      }
      return tasks;
    }
   /* if(model.allFilter){
      return;
    }*/
  	if(model.todayFilter){
  		var today=Date.today();
  		tasks = _.filter(tasks, function(element){ 
        return Date1.parse(element.dueDate).getTime() == today.getTime()
      });
  	}
  	if(model.typeFilter){
 		   tasks = _.filter(tasks, function(element){ return element.type&&element.type.startsWith(model.typeFilter)});
  	}
  	if(model.routeFilter){
  		if(model.routeFilter=="c"||model.routeFilter=="e"||model.routeFilter=="sc"){
  			tasks = _.filter(tasks, function(element){ return element.route&&element.route.startsWith(model.routeFilter)});
  		}
		
  	}
    if(model.timeFilter){
      if(model.timeFilter=="10"||model.timeFilter=="20"){
        tasks = _.filter(tasks, function(element){ return element.duration<=parseInt(model.timeFilter)});
      }
    
    }
  	if(model.statusFilter){
  		tasks = _.filter(tasks, function(element){ return element.status&&element.status.startsWith("n")});
  	}
  	if(model.priorityFilter){
  		tasks = _.filter(tasks, function(element){ return element.priority&&( element.priority.startsWith("p"))});
  	}
    if(model.tagFilter&&model.tagFilter.trim()!=""){
      tasks = _.filter(tasks, function(element){
        if(!element.tags) return false;
        var returnValue=true;
        $.each(model.tagFilter.split(","),function(index,value){
          returnValue=returnValue&&element.tags.indexOf(value)>-1;
        })
        return returnValue;
      });
      
    }
    if(model.timeOfDayFilter){
      tasks = _.filter(tasks, function(element){
        if(!element.timeOfDay||model.timeOfDayFilter=="all"){
          return true;
        } 
        var currTime= new Date().getTime();
        var taskTime=Date.parse(element.dueDate).setHours(element.timeOfDay);
        return taskTime<(currTime+(2*3600*1000))
      });
    }
  	
    model.filteredTasks=tasks;
    // return the current `item`, but call `toUpperCase()` on it
    return tasks;
  };
});


demo.controller("Ctrl",

function Ctrl($scope,$http) {

	  

   /* jQuery(document).on('keypress', function(e){
        if ( e.which == 13 &&$scope.model.selected.task) {
          $scope.$apply($scope.saveTask($scope.model.selected.id));
          //e.preventDefault();
        }
         
    });*/

    angular.element(window).on('keydown', function(e) {
        console.log(e);
        if (e.ctrlKey && e.keyCode == 13 && !$scope.model.selected.task) {
          // Ctrl-Enter pressed
          $scope.incrementMaxDate($scope.model.filteredTasks[$scope.model.focusIndex],3);

          if (!$scope.$$phase) {
            $scope.$apply();
          }
          return;
        }

        if (e.ctrlKey && e.keyCode == 80 && !$scope.model.selected.task) {
           e.preventDefault();
          // Ctrl-P pressed for changing priority
          $scope.changePriority($scope.model.filteredTasks[$scope.model.focusIndex]);

          if (!$scope.$$phase) {
            $scope.$apply();
          }
         
          return;
        }


        if (e.ctrlKey && e.keyCode == 83 ) {
          e.preventDefault();
          // Ctrl-S pressed, for saving tasks
          $scope.saveAll();
         
          return;
        }



        if ( e.which == 13 ) {
          if($scope.model.selected.task){
            $scope.saveTask($scope.model.selected.id);
           
          }
          else if(typeof $scope.model.focusIndex != 'undefined'){
            $scope.editTask($scope.model.filteredTasks[$scope.model.focusIndex]);
          }
          if (!$scope.$$phase) {
            $scope.$apply();
          }
          //e.preventDefault();
        }

        

        if ( e.which == 38 ) {
          if(typeof $scope.model.focusIndex == 'undefined'){
            $scope.model.focusIndex=$scope.model.filteredTasks.length-1;
          }
          else{
            if($scope.model.focusIndex>0)
              $scope.model.focusIndex--;
          }
          
          if (!$scope.$$phase) {
            $scope.$apply();
          }
          //e.preventDefault();
        }
        if ( e.which == 40 ) {
          if(typeof $scope.model.focusIndex == 'undefined'){
            $scope.model.focusIndex=0;
          }
          else{
            if($scope.model.focusIndex<($scope.model.filteredTasks.length-1))
              $scope.model.focusIndex++;
          }
          
          if (!$scope.$$phase) {
            $scope.$apply();
          }
          //e.preventDefault();
        }
    });


    $scope.open = function() {
      $scope.showModal = true;
    };

    $scope.ok = function() {
      $scope.showModal = false;
    };

    $scope.cancel = function() {
      $scope.showModal = false;
    };


    $scope.model = {
        
        selected: {},
        currenttime:{height:100,width:100,x:0,y:0},
        showNote:false,
        selected:{}
    };
   
   $scope.getDisplayPriority=function(task){
      return (task.priority==undefined||task.priority.trim().length==0)?"nothing":task.priority.replace(/^m/,"medium").replace(/^p/,"higher").replace(/^l/,"low")

   }

    // gets the template to ng-include for a table row / item
    $scope.getTemplate = function (task) {
        if (task.id === $scope.model.selected.id) return 'edit';
        else return 'display';
    };
    $scope.hideFilter=true;
    $scope.editTask = function (task) {
        $scope.model.selected = angular.copy(task);
        //$scope.model.selected.type="personal";
        $scope.hideFilter=false;
        $scope.model.selected.taskIndex=$scope.model.tasks.indexOf(task);
    };

    $scope.saveTask = function (id) {
        
        
        if(!Date.parse($scope.model.selected.dueDate)||!Date.parse($scope.model.selected.maxDate)){
          alert("please enter proper date"); 
          return;
        }

        if(Date.parse($scope.model.selected.dueDate).getTime()>Date.parse($scope.model.selected.maxDate).getTime()){
          alert("max date should be >= than due date"); 
          return;
        }
        //ng-model="model.selected.task" 
        var task=_.filter($scope.model.tasks, function(task){ return task.id == id;});
        
        $scope.model.savedTaskIndex=$scope.model.filteredTasks.indexOf(task);
        var duration=$scope.model.selected.duration;
        $scope.model.selected.duration=parseInt(duration);
        angular.copy($scope.model.selected,task[0]);
        $scope.reset();
        $scope.saveAll();
        $scope.model.lastSavedTask=task[0].task;
    };

    $scope.reset = function () {
        $scope.model.selected = {};
        $scope.hideFilter=true;
    };

    //days to check the time used up
    $scope.model.daysToDisplay=[];
    
    $scope.daysToDisplay=5;
    for (var i = 0; i <= $scope.daysToDisplay; i++) {
    	var today=Date.today();
        today.add(i).days();
       	$scope.model.daysToDisplay.push(today);
     
    }



    $scope.getTimeString = function(date) {
    	var dayTasks=getTask($scope.model.tasks,date)
    	var offTasks=_.filter(dayTasks, function(task){ return task.type&&task.type.startsWith("o");});
    	var totOffTime=_.reduce(offTasks, function(memo, task){ return memo + task.duration }, 0);

    	var perTasks=_.filter(dayTasks, function(task){ return task.type&&task.type.startsWith("p");});
    	var totPerTime=_.reduce(perTasks, function(memo, task){ return memo + task.duration }, 0);

    	return "Official:"+totOffTime+" Personal:"+totPerTime;
    }
    



    $scope.addRow = function() {
        var task={id:new Date().getTime(),task: 'Empty', priority:'m' ,duration: 20,dueDate: new Date().toString('yyyy-MM-dd'),maxDate: new Date().toString('yyyy-MM-dd'),status:'notdone'};
        $scope.model.tasks.unshift(task);
        $scope.editTask(task);
    };

    $scope.remove = function (task) {
      var isDelete=confirm("Do you really want to remove:"+task.task+"?");
      if(!isDelete){
        return;
      }
    	$scope.model.tasks = _.filter($scope.model.tasks, function(element){ return element.id != task.id;});

      $scope.model.lastSavedTask=task;
      
    };  

    $scope.minutesPerDay=360;
    $scope.daysToConsider=15;
    $scope.reAssign= function () {
        $scope.handleOldTasks();
        reAssignDates($scope.model.tasks);
        //var dayTasks=getTask($scope.model.tasks,Date.today());
    }


   $scope.incrementDueDate= function (task,days){
      //T00:00:00-0700
      task.dueDate=Date1.parse(task.dueDate).add(days).days().toString("yyyy-MM-dd");
      //task.dueDate=Date.parse(task.dueDate).add(days).days().toString("yyyy-MM-dd");
   }
   $scope.incrementDuration= function (task,duration){

      task.duration=task.duration + (duration);
   }

   $scope.incrementMaxDate= function (task,days){
      task.maxDate=Date1.parse(task.maxDate).add(days).days().toString("yyyy-MM-dd");
      //task.maxDate=Date.parse(task.maxDate).add(days).days().toString("yyyy-MM-dd");
   }

   $scope.changeStatus= function (task){
      var statuses=['notdone','done']
      
      var index=jQuery.inArray( _.filter(statuses, function(element){ return element.startsWith(task.status.charAt(0))})[0], statuses );
      task.status=statuses[index==0?1:0];

   }

   $scope.changePriority= function (task){
      var priorities=['p','m','l']
      
      var index=jQuery.inArray( _.filter(priorities, function(element){ return element==task.priority})[0], priorities );
      console.log(index);
      index=[(++index)%3];
      console.log(index);
      task.priority=priorities[index];

   }

   $scope.changeType= function (task){
      var types=['official','personal']
      
      if(task.type){
        
        var index=jQuery.inArray( _.filter(types, function(element){ return element.startsWith(task.type.charAt(0))})[0], types );
        task.type=types[index==0?1:0];
      }
      else{
        task.type=types[0];
      }
      
       
      

   }

    //go through the dates and push the task to the next day, if it has time left

    function reAssignDates(tasks){
        
        for (var i = 0; i <= $scope.daysToConsider; i++) {
        	var today=Date.today();
            var analysisDate=today.add(i).days();
           //see whether we have lower priority task for the day
            var lowerTasks= getLowerPriorityTasks(analysisDate,tasks);
            //filter out the one with < 10 mins of task duration
            lowerTasks= filterOutLessDurationTasks(lowerTasks,10);
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
      //filter out the one with lesser duration from lower priority ones, so that those tasks are postponded.
    function filterOutLessDurationTasks(lowerTasks,duration){
        var lowerTasks= _.filter(lowerTasks, function(element){
            // if no duration defined , these are considered lower priority ones.
            if(!element.duration){
              return true;
            }
            //all the tasks with greater duration are lower priority ones.
            return (element.duration>duration) 
        });
        return lowerTasks;
        
    }

    function getTotalTime(day){
        var daysTasks=getTask($scope.model.tasks,day);
        var totalTime=0;
        _.each(daysTasks, function (task) {
           totalTime+=parseInt(task.duration);
        });
        return totalTime;
    }


    function getTask(tasks,date){
        var dayTasks=[]
        //dayTasks = _.filter(tasks, function(element){ return Date.parse(element.dueDate).getTime() == date.getTime()&&element.status.startsWith("n")});
        dayTasks = _.filter(tasks, function(element){ 
          return element.dueDate ==date .toString("yyyy-MM-dd")&&element.status.startsWith("n")
        });
        return dayTasks;
    }

    $scope.handleOldTasks= function () {
        var today=Date.today();
        oldTasks = _.filter($scope.model.tasks, function(element){ return Date.parse(element.dueDate).getTime() < today.getTime() && element.status.startsWith("n")});
        _.each(oldTasks, function (task) {
           task.dueDate=today.toString("yyyy-MM-dd");
        });

        oldTasks = _.filter($scope.model.tasks, function(element){ return Date.parse(element.maxDate).getTime() < today.getTime() && element.status.startsWith("n")});
        _.each(oldTasks, function (task) {
           task.maxDate=today.toString("yyyy-MM-dd");
        });
    }



    $scope.saveAll = function() {
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
    };



    $scope.fetchData=function() {
        // Simple GET request example :
		$http.get('/public/mytask.json').
		success(function(data, status, headers, config) {
		    // this callback will be called asynchronously
		    // when the response is available
		    console.log(status);
		    console.log("before::"+new Date().getTime())
		    angular.forEach(data, function (task) {
			    task.duration = parseInt(task.duration);
          		//task.dueDate=Date.parse(task.dueDate).toString('yyyy-MM-dd');
          		//task.maxDate=Date.parse(task.maxDate).toString('yyyy-MM-dd');
			});
  			$scope.model.tasks = data;
  			console.log("after::"+new Date().getTime())
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
		    /*var re = /\n/;
		    var cronTasks = data.split(re);*/
		    _.each(data, function(task) {
		        if (needsToday(task)) {
		            var task = {
		                id: new Date().getTime(),
		                task: task.split("@")[1],
		                duration: 20,
		                dueDate: new Date().toString('yyyy-MM-dd'),
		                maxDate: new Date().toString('yyyy-MM-dd'),
		                status: 'notdone',
		                type: "personal",
		                priority: "p"
		            };
		            setTimeout(function() {
		            	var cronTask=_.filter($scope.model.tasks, function(element){ 
		            		//if there is another task already present for the same month, skip it. THis is needed for crontask,ow duplicate would occur
		            		return element.task.trim()==task.task.trim()&&Date.parse(element.dueDate).toString("MM")==Date.today().toString("MM");
		            	});
		            	if(cronTask.length==0){
		            		$scope.model.tasks.push(task);
		            		if (!$scope.$$phase) {
						      	$scope.$apply();
						    }
		            	}
		                
		            }, 1000);


		        }
		    });
		}).
		error(function(data, status, headers, config) {
		    // called asynchronously if an error occurs
		    // or server returns response with an error status.
		    console.log(status);
		});


    }   
    $scope.fetchData();   




});