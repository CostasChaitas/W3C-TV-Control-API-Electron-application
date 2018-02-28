var TVSource = require('../API/TVSource');

function TVTuner(){
	console.log("TVTuner created!");
}

TVTuner.prototype.getSources = function(){

	return new Promise(function(resolve, reject) {
		var sources = [];
		sources[0] = new TVSource();
		resolve(sources);
	});

}

TVTuner.prototype.currentSource = null;


module.exports = TVTuner;