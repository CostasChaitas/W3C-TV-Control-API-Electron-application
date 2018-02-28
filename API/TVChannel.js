var TVProgram = require('../API/TVProgram');
const fs = require('fs');
var dvbtee = require('dvbtee');

var currentProgram;
var epg_path = __dirname + '/../EPG/';

var epg_events = [];

// We store our fifo out of the function (needed to close it latter, but you can use a class if you want)
var fifo;
// needed for EPG gathering
var parser = new dvbtee.Parser;

function TVChannel(name, serviceId){
	currentProgram = new TVProgram("");
	this.name = name;
	this.serviceId = serviceId;
}

// open the fifo
init_fifo();

// will be called everytime we receive epg events
parser.on('data', function(data) {
	// only events with tableId=78 are interesting epg events
	if (data.tableId == 78){
		epg_events.push(data);
	}
})

TVChannel.prototype.getCurrentProgram = function(){

	var service_id = this.serviceId;

	return new Promise(function(resolve, reject){

		var title = "";

		for (var i = 0; i < epg_events.length; i++)
		{
			var obj = epg_events[i];
			// check if event includes epg for current channel (common lastTableId for current program is 78)
			if (obj.serviceId.toString() == service_id && obj.lastTableId == "78")
			{
				title = obj.events[0].descriptors[0].name;
				// program time is unix time, so we need to convert it
			  	var time = getTime(obj.events[0].unixTimeBegin, obj.events[0].unixTimeEnd);
			  	currentProgram.title = time + " " + title;
			  	break;
			}
		}

		// title is not empty, so we found the program
		if (currentProgram.title != "")
		{
			resolve(currentProgram);
			console.log("Found current program");
		}

		// title is empty, didn't find program
		else
		{
			reject("Failed to get EPG!");
			console.log("Could not find current program!");
		}

	});

}

TVChannel.prototype.getPrograms = function(){

	var service_id = this.serviceId;

	return new Promise(function(resolve, reject) {

		var programs = [];

		for (var i = 0; i < epg_events.length; i++)
		{
			var obj = epg_events[i];
			// check if event includes epg for current channel (common lastTableId for whole program are 80, 81)
			if (obj.serviceId.toString() == service_id && obj.lastTableId == "81" || obj.lastTableId == "80")
			{
				for (var e = 0; e < obj.events.length; e++)
				{
					// program time is unix time, so we need to convert it
					var time = getTime(obj.events[e].unixTimeBegin, obj.events[e].unixTimeEnd);
			  		var title = time + " " + obj.events[e].descriptors[0].name;
					var program = new TVProgram(title);
					programs.push(program);
				}
				break;
			}
		}

		// the array is not empty, so we found at least one program
		if (programs.length > 0)
		{
			resolve(programs);
			console.log("Found programs");
		}

		// array is empty, didn't find any program information
		else
		{
			reject("Failed to get EPG!");
			console.log("Could not find programs!");
		}

	});

}

TVChannel.prototype.name = "";

TVChannel.prototype.serviceId = "";

function init_fifo() {
	try {
		if (fs.lstatSync('fifo-copy').isFIFO()) {
			// When putting a line with some commands, such as 'echo "line" > fifo', an EOF will be written in the fifo
			// and the stream will be closed. So, we reopen the fifo.
			parser.once('end', init_fifo);

			parser.on('data', function (data) {
				// Not needed for our current purposes
			});

			// We open the FIFO file called "fifo-copy" in the working directory
			fifo = fs.createReadStream('fifo-copy').pipe(parser);
		}
	}
	// Here, you could handle the case when the fifo doesn't exist (for example, creating the fifo)
	catch (e) {}
}

// will convert unix time to normal time
function getTime(start, end){
	var date_start = new Date(start*1000);
	var hours_start = "0" + date_start.getHours();
	var minutes_start = "0" + date_start.getMinutes();

	var startTime = hours_start.substr(-2) + ':' + minutes_start.substr(-2);

	var date_end = new Date(end*1000);
	var hours_end = "0" + date_end.getHours();
	var minutes_end = "0" + date_end.getMinutes();

	var endTime = hours_end.substr(-2) + ':' + minutes_end.substr(-2);

	return (startTime + " - " + endTime + " : ");
}

module.exports = TVChannel;
