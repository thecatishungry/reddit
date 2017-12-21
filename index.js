const snoowrap = require('snoowrap'),
      request = require('request');

const mysub = 'barcasubdesign',
      regex = new RegExp('(^#{5}[a-zA-Z0-9(*].*\n){3}','gm');

var interval = 600000;

//600000  = 10 minutes
//900000  = 15 minutes
//3600000 = 1 hour
//6600000 = 1 hour 50 minutes

const r = new snoowrap({
  userAgent: 'barca bot',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN
});

function get_barca_unix(callback) {
  request('https://www.fcbarcelona.com/football/first-team/schedule', function (error, response, body) {

    if (error) {
      console.log('error:', error);
      setTimeout(function(){ do_loop(); }, interval);
    }

    else {
      console.log('statusCode:', response && response.statusCode);
    
      let timestamp = body.match(/target_date.*/g);
      let final = timestamp_to_code(timestamp);

      console.log(final);

      callback(final);
    }
  });
}

function timestamp_to_code(timestamp) {

  let current_date = new Date().getTime();
  let difference = timestamp - current_date;

  let target_date = timestamp[0].split("'")[1];
  let days, hours, minutes, seconds;
  let seconds_left = (target_date - current_date) / 1000;

  days = parseInt(seconds_left / 86400);
  seconds_left = seconds_left % 86400;
  hours = parseInt(seconds_left / 3600);
  seconds_left = seconds_left % 3600;
  minutes = parseInt(seconds_left / 60);
  seconds = parseInt(seconds_left % 60);

  if (difference <= 0) {
    console.log('match under way. sleeping for 110 minutes.');

    interval = 6600000;
    let final = `#####Next match in:\n#####**Match currently is progress\n#####(updated every 60 minutes)\n`;
    return final;

  }
  else if (difference <= 21600) {
    console.log('6 hrs or less remaining. setting interval to 15 minutes.');

    interval = 900000;
    let final = `#####Next match in:\n#####**${hours}** hours **${minutes}** minutes\n#####(updated every ${(interval / 1000) / 60} minutes)\n`;
    return final;
  }
  else if (difference >= 21600) {
    console.log('more than 6 hours remaining. setting interval to 1 hour.');

    interval = 3600000;
    let final = `#####Next match in:\n#####**${days}** days **${hours}** hours\n#####(updated every ${(interval / 1000) / 60} minutes)\n`;
    return final;
  }
}

function get_sidebar(callback) {
  r.getSubreddit(mysub).getSettings().then(function(data) {
    callback(data);
  })
}

do_loop();

function do_loop() {
  get_sidebar(function(data){

    if (data.description.match(regex)) {

      get_barca_unix(function(result) {
        var current_sidebar = data.description;
        var new_sidebar = current_sidebar.replace(regex,result);

        r.getSubreddit(mysub).editSettings({ description: new_sidebar });
        setTimeout(function(){ do_loop(); }, interval);
      })

    }

    else {
      console.log('timer not found on sidebar.');
      setTimeout(function(){ do_loop(); }, interval);
    }

  });
}

// let starter = setInterval(do_loop, interval);

// function kill_loop() {
//   clearInterval(starter);
// }


