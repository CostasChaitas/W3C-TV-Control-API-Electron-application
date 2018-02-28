const http = require('http')

var port = 1337;
var http_server;

// Maintain a hash of all connected sockets
var sockets = {};
var nextSocketID = 0;

function TVServer(){
  console.log("Created TVServer");
}

function getLivestream(ffmpeg){

  var livestream = function (req, resp) {

    console.log("Creating stream");

    resp.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "video/mp4",      
      "Accept-Ranges": "bytes"             
    });

    // important! will pipe the converted video data to the servers response (-> client)
    ffmpeg.stdout.pipe(resp);

    req.on("close", function () {
      console.log("Server should be closed!");
      closeServer("closed")
    })

    req.on("end", function () {
      console.log("Server should be ended!");
      closeServer("ended")
    });

    closeServer = function(event) {
      console.log("Live streaming connection to client has been " + event)
    }
    return true
  }
  return livestream;
}

// will create and start the server on the given port
// port will be increased by 1 in order to avoid problems with 
// with client waiting for closed server (could be optimized)
TVServer.prototype.createServer = function(ffmpeg){

  return new Promise(function (resolve, reject){

    console.log("Creating server!");
    var stream = getLivestream(ffmpeg);
    port++;
    http_server = http.createServer(stream).listen(port, function () {
      http_server.on('error', function(err) {
        console.log("Server: Error occured!");
        reject("Server couldn't be started!");
      });
      console.log("Server listening on port " + port);
      resolve("Server is running");
    });

    http_server.on('connection', function (socket) {
      // Add a newly connected socket
      var socketID = nextSocketID++;
      sockets[socketID] = socket;
      console.log('Socket: ', socketID, ' -> opened');

      // Remove the socket when it closes
      socket.on('close', function () {
        console.log('Socket: ', socketID, ' -> closed');
        delete sockets[socketID];
      });

    });

  });
}

// stops server and destroys all sockets
TVServer.prototype.stopServer = function(){

  return new Promise(
    function(resolve, reject){

    // Close the server
    http_server.close(function () 
    {
     console.log('Server closed!');
     resolve("Server sucessfully closed!")
   });

    // Destroy all open sockets
    for (var socketID in sockets)
    {
      console.log('Socket: ', socketID, ' -> destroyed');
      sockets[socketID].destroy();
    }

  });
}

module.exports = TVServer;