var Navigator = require(__dirname+"/API/Navigator");
var nav = new Navigator();

var fs = require('fs');
var $ = require('jQuery');

// port for server
var port = 1337;

var currentChannelNumber;
var currentChannelName = "";
var currentPage;

var settings_path = __dirname + "/config/settings.json";

var source = nav.tv.getTuners().then(function (tuners) {
  tuners[0].getSources().then(function (sources){
    source = sources[0];
  });
});

// will be called if a channel is clicked from the sidebar
// will call setCurrentChannel API function
// and display EPG if client is on EPG tab
function changeChannel(channelNumber){

  currentChannelNumber = channelNumber;
  currentChannelName = $("#" + currentChannelNumber).text();

  source.setCurrentChannel(channelNumber).then(function(result){
    port++;
    console.log("Setting current channel... : " + result);
    // display the stream for the server with given port
    document.getElementsByTagName("video")[0].setAttribute("src", "http://localhost:"+ port.toString());
  }).catch(function(result){
    console.log("Could not set current channel!");
  });

  if(currentPage === "EPG")
  {
    showEPG();
  }

  // A channel is selected so remove the warning "no channel selected"
  $("#channelSelected_TV").css("display" , "inline");
  $("#noChannelSelected_TV").css("display" , "none");
}

// will call API functions getCurrentProgram, getPrograms
// and display response in EPG tab (+ showing loading animation)
function showEPG(){

  console.log("SHOW EPG!");

  // only update EPG and show animation if a channel is selected
  if (currentChannelName != "")
  {
    // A channel is selected so remove the warning "no channel selected"
    $("#noChannelSelected_EPG").css("display" , "none");

    // show loading animation
    $('.loader').css("display", "inline");
    $("#channelSelected_EPG").css("display" , "none");

    source.getChannels().then(function(channels){

      var channel_index = 0;
      // find the channel index, in order to get later the program using the index
      for (i = 0; i < channels.length; i++)
      {
        if (channels[i].name === currentChannelName)
        {
          channel_index = i;
        }
      }

      document.getElementById("channel_name").innerHTML = currentChannelName;

      // wait 5 seconds to receive enough epg events for the program information
      setTimeout(function () {

          channels[channel_index].getCurrentProgram().then(function(program){
            document.getElementById("current_program").innerHTML = program.title;
          }).catch(function(error){
            document.getElementById("current_program").innerHTML = "Not enough data received";
            })

          channels[channel_index].getPrograms().then(function(programs){
            var programs_string = "";
            for (i = 0; i < programs.length; i++)
            {
              programs_string = programs_string + "<li>" + programs[i].title + "</li>"
            }
            programs_string_unordered_list = "<ul>" + programs_string + "</ul>";
            document.getElementById("whole_program").innerHTML = programs_string_unordered_list;

          }).catch(function(error){
            document.getElementById("whole_program").innerHTML = "Not enough data received";
              console.log(error)
          })

          // remove loading animation
          $("#channelSelected_EPG").css("display" , "inline");
          $('.loader').css("display", "none");
        }, 5000)





    })
  }
}

// will be called if user clicks on one of the tabs (Television, EPG, Settings)
function change_tab(clicked_tab){

  if (clicked_tab.id === "tab_1"){
      currentPage = "EPG";
      showEPG();
  } else if (clicked_tab.id === "tab_2"){
    // it's the settings tab -> we need to show the user the current resolution
    showResolution();
  }
  else
  {
    currentPage = "Not EPG page";
  }

  //close all open_tabs and open_panels
  var open_tabs = document.getElementsByClassName('open_tab');
  for(var i = 0; i < open_tabs.length; i++){
    open_tabs[i].className = '';
  }

  var open_panels = document.getElementsByClassName('open_panel');
  for(var i = 0; i < open_panels.length; i++){
    open_panels[i].className = 'closed_panel';
  }

  //open tab and panel
  document.getElementById(clicked_tab.id).className = 'open_tab';
  var clicked_tab_nr = clicked_tab.id.charAt(clicked_tab.id.length - 1);
  var panel_id_string = "panel_" + clicked_tab_nr;
  document.getElementById(panel_id_string).className = "open_panel";
}

// set the Television tab as the active tab
change_tab(document.getElementById('tab_0'));


jQuery(document).ready(function($) {

  $('a').on('click', function(e) {
    e.preventDefault();
  });

  // toggle the sidebar, when we receive a click
  $('.trigger-sidebar-toggle').on('click', function() {
    $('body').toggleClass('sidebar-is-open');
  });

  // set channel visually active (highlight)
  $('li').click(function() {
    $(this).addClass('active').siblings().removeClass('active');
  });

});

// will save the selected resolution from the settings tab to the settings.json
function saveResolution(){
  var element = document.getElementById("resolutions");
  var resolution = element.options[element.selectedIndex].value;
  console.log(resolution);

  var settings = JSON.parse(fs.readFileSync(settings_path, 'utf8'));
  settings.EPG[0].resolution = resolution;

  var fd = fs.openSync(settings_path, 'w');
  fs.writeFile(settings_path, JSON.stringify(settings, null, "\t"), function(err) {
    if (err)
    {
      console("Could not save settings: " + err);
      alert("Could not save settings!");
    }
    else {
      console.log('settings.json updated!');
      showResolution();
    }
  });
}

// will display the current saved resolution
function showResolution(){

  var settings = JSON.parse(fs.readFileSync(settings_path, 'utf8'));
  var resolution = settings.EPG[0].resolution;

  document.getElementById("currentResolution").innerHTML = "Your current resolution is: " + resolution;
}
