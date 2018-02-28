var TVTuner = require('../API/TVTuner');

function TVManager(){
	console.log("TVManager created!");
}

TVManager.prototype.getTuners = function(){

	return new Promise(function(resolve, reject) {
		var tuners = [];
		tuners[0] = new TVTuner();
		resolve(tuners);
	});
};

module.exports = TVManager;