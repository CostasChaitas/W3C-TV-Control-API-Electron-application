var TVChannel = require('../API/TVChannel');

const Tuner = require('node-tuner');
const path = require('path')
const fs = require('fs');
const when = require('when');

var server = require('../js/TVServer');
var ffmpeg = require('../js/TVffmpeg');
const channel_list = require('../config/channels.json')

var TVffmpeg = new ffmpeg();
var TVServer = new server();

var tuner = new Tuner();
// indicates that tuner is not tuned
var current_frequency = -1;


function TVSource(){
  console.log("TVSource created!");
}

TVSource.prototype.getChannels = function(){

  return new Promise(function(resolve, reject) {

  var channels = [];

  // extract and save all the channels names and their service ids
  for (var obj in channel_list.channels)
  {
    var channel = channel_list.channels[obj];
    channels.push(new TVChannel(channel.name, channel.serviceId));
  }

  resolve(channels);

	});
};

TVSource.prototype.setCurrentChannel = function(channelNumber){

  var serviceId = channelNumber;

  return new Promise(function(resolve, reject){

      var meta = getChannelMeta(serviceId);

      // the tuner is not tuned at all
      if (current_frequency == -1)
      {
        startTuner(meta.frequency, meta.delsys).then(() => {

          console.log("Tuner started successfully!");

          TVffmpeg.startFFMPEG(tuner, serviceId);
          TVServer.createServer(TVffmpeg.getProcess()).then(function(result)
          {
            resolve("Set current channel successfully!");
          }).catch(function(){
            console.log("Server could not be started!");
            reject("Could not set channel");
          });

        // if tuner could no be started  
        }).catch(() => {
            console.log("Tuner could not be started!");
            alert("Tuner could not be started. Please close the application. Replug the stick and start the application again.");
            reject("Could not set channel");
          });
      }

      // tuner is tuned and channel is on current frequency
      // start/restart ffmpeg and create server
      else if (meta.frequency == current_frequency)
      {
        console.log("Channel: " + serviceId + " is on current frequency: " + current_frequency);
        if (!TVffmpeg.isRunning)
        {
          TVffmpeg.startFFMPEG(tuner, serviceId);
          TVServer.createServer(TVffmpeg.getProcess()).then(function(result)
          {
          resolve("Set current channel successfully!");
          });
        }

        // ffmpeg is running -> stop ffmpeg and server
        // restart ffmpeg and create new server
        else
        {
          TVServer.stopServer().then(function(result){
            console.log("Server Promise: " + result);
            TVffmpeg.stopFFMPEG(tuner);
            TVffmpeg = new ffmpeg();
            TVffmpeg.startFFMPEG(tuner, serviceId);
            TVServer.createServer(TVffmpeg.getProcess()).then(function(result){
              console.log("Server Promise: " + result);
              resolve("Set current channel successfully!");
            }).catch (function(result){
              console.log("Server Promise: " + result);
            });

          }).catch(function(result){
            console.log("Server Promise" + result);
            reject("Could not set channel!");
          });
        }

      }

      // tuner is tuned, but channel is on other frequency
      else if ((meta.frequency != current_frequency) && meta.frequency != -1 && current_frequency != -1)
      {
        console.log("Channel: " + serviceId + " is NOT on current frequency: " + current_frequency + " but on " + meta.frequency);

        console.log("Will stop the tuner and tune to the new frequency");

        // if ffmpeg is running -> stop ffmpeg and server
        if(TVffmpeg.isRunning){
          TVServer.stopServer().then(function(result){
          console.log("Server Promise: " + result);
          TVffmpeg.stopFFMPEG(tuner);
          TVffmpeg = new ffmpeg();
          }).catch(function(result){
            console.log("Server Promise" + result);
            reject("Could not set channel");
          });
        }

        stopTuner(tuner, 1).then(() => {

          console.log("Tuner closed successfully!");

          startTuner(meta.frequency, meta.delsys).then(() => {

            console.log("Tuner started successfully!");

            TVffmpeg.startFFMPEG(tuner, serviceId);
            TVServer.createServer(TVffmpeg.getProcess()).then(function(result){
              console.log("Promise: " + result);
              resolve("Sucess");
            }).catch(function(result)
            {
              console.log("Server Promise" + result);
              reject("Could not set channel");
            });

          // tuner could not be started  
          }).catch(() => {
            console.log("Tuner could not be started!");
            alert("Tuner could not be started. Please close the application. Replug the stick and start the application again.");
            reject("Could not set channel");
          });

        // tuner could not be closed
        }).catch((err) => {
          console.log("Error while closing the tuner! Error: "  + err);
          alert("Tuner could not be closed. Please restart the application.");
          reject("Could not set channel");
        });
      }

      // requested channel (service id) was not found in channel list
      else
      {
        reject(new Error("Did not find channel"));
        console.log("Requested channel was not found in channel list!");
      }

  });

};

TVSource.prototype.currentChannel = null;

// END OF API

// return frequency and delsys (DVB-T or DVB-T2) for requested channel
function getChannelMeta(serviceId){
  var meta = {frequency: -1, delsys: -1};

  for (var obj in channel_list.channels)
  {
    var channel = channel_list.channels[obj];

    if (channel.serviceId === serviceId)
    {
        meta.frequency = channel.frequency;
        meta.delsys = channel.delsys;
    }
  }

  return meta;
}


// start the tuner with desired frequency and delsys
function startTuner(f, d){

  current_frequency = f;

  var options = {frequency: f, delsys: d};

  return when.promise((ok, ko) => {
    tuner.start(options).then(() => {
      return ok();
    }).catch(ko);
  });
}

// try to stop tuner
function stopTuner(tuner, iterations) {
  return when.promise((ok, ko) => {
      tuner.stop().then(() => {
        console.log('stoped.');
        if (!iterations || iterations <= 1) {
          return ok();
        }
        //return setTimeout(stopTuner.bind(this, iterations - 1), 1000);
      }).catch(ko);

  });

}

module.exports = TVSource;
