var fs = require('fs');

function TVffmpeg(){
  console.log("Created FFMPEG");
}

var child_process = require('child_process');

var ffmpeg = null;
// set to true to display info for every converted frame on console
var debug_info = false;

TVffmpeg.prototype.isRunning = false;

// starts ffmpeg with all arguments and pipes tuner output to its input
TVffmpeg.prototype.startFFMPEG = function(tuner, program_id){

      console.log("FFMPEG started: " + tuner + " " + program_id);
      this.isRunning = true;
      var resolution = getResolution();

      ffmpeg = child_process.spawn("ffmpeg", [
        "-i", "-", "-y", "-map", "0:p:"+program_id, "-sn", "-ignore_unknown",
        "-c", "copy", "-af", "aresample=async=1000",
        "-acodec", "aac", "-vcodec", "libx264", "-f", "mp4", "-movflags",
        "empty_moov+default_base_moof+frag_keyframe+faststart",
        "-s", resolution,
        "-g", "2", "-preset", "ultrafast",
        "-flags", "global_header",  "-"
        ],  {detached: false});

      // pipe the output of the tuner directly to ffmpeg
      tuner.pipe(ffmpeg.stdin);

      ffmpeg.stdout.on("data",function(data) {
        //console.log("ffmpeg received data " + data);
      });

      ffmpeg.stderr.on("data", function (output) {
        if (debug_info) console.log("ffmpeg -> " + output);
      });
      ffmpeg.on("exit", function (code) {
        console.log("ffmpeg terminated with code " + code);
      });
      ffmpeg.on("error", function (e) {
        console.log("ffmpeg system error: " + e);
      });
}

// stops ffmpeg process 
TVffmpeg.prototype.stopFFMPEG = function(tuner)
{
  console.log("Killing ffmpeg!");
  tuner.unpipe(ffmpeg.stdin);
  ffmpeg.stdin.pause();
}

// return ffmpeg process reference
TVffmpeg.prototype.getProcess = function()
{
  return ffmpeg;
}

// returns saved resolution from settings file
function getResolution(){
  
  var settings = JSON.parse(fs.readFileSync(__dirname + "/../config/settings.json", 'utf8'));

  var resolution = settings.EPG[0].resolution;

  console.log(resolution);

  return resolution;
}

module.exports = TVffmpeg;
