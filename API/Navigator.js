var TVManager = require('../API/TVManager');

function Navigator(){
	console.log("Navigator created!");
}

Navigator.prototype.tv = new TVManager();

module.exports = Navigator;