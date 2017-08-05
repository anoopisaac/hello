function needsToday(cronString){
	var dayOfMonth=cronString.split(" ")[0];
	var month=cronString.split(" ")[1];
	Date.parse();
	if(dayOfMonth=="*"){
		dayOfMonth=parseInt(Date.today().toString("dd"));
	}
	else{
		dayOfMonth=parseInt(dayOfMonth);
	}

	if(month=="*"){
		month=parseInt(Date.today().toString("MM"));
	}
	else{
		month=parseInt(month);
	}
	var taskDate=Date.parse(month+"/"+dayOfMonth+"/"+Date.today().toString("yyyy"));
	// if the task date is greater than todays dates, always show the task
	if(taskDate){
		return Date.today().getTime()>=taskDate.getTime();
	}
	return false;
}