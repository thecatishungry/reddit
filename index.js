const snoowrap = require('snoowrap'),
      request = require('request');

const mysub = 'barcasubdesign',
      regex = new RegExp('(^#{5}[a-zA-Z0-9(*].*\n){3}','gm'),
      interval = 600000;

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
    }

    else {
      console.log('statusCode:', response && response.statusCode);
    
      var timestamp = body.match(/target_date.*/g);
      let final = timestamp_to_code(timestamp);

      callback(final);
    }
  });
}

function timestamp_to_code(timestamp) {

  let target_date = timestamp[0].split("'")[1];
  let days, hours, minutes, seconds;

  let current_date = new Date().getTime();
  let seconds_left = (target_date - current_date) / 1000;

  days = parseInt(seconds_left / 86400);
  seconds_left = seconds_left % 86400;
  hours = parseInt(seconds_left / 3600);
  seconds_left = seconds_left % 3600;
  minutes = parseInt(seconds_left / 60);
  seconds = parseInt(seconds_left % 60);

  let final = `#####Next match in:\n#####**${days}** days **${hours}** hours **${minutes}** minutes\n#####(updated every ${(interval / 1000) / 60} minutes)\n`;

  return final;
}

function get_sidebar(callback) {
  r.getSubreddit(mysub).getSettings().then(function(data) {
    callback(data);
  })
}

do_loop();

function do_loop() {
  get_sidebar(function(data){

    console.log(data.description.match(regex));


    if (data.description.match(regex)) {

      get_barca_unix(function(date) {
        var current_sidebar = data.description;
        var new_sidebar = current_sidebar.replace(regex,date);
          r.getSubreddit(mysub).editSettings({ description: new_sidebar });
      })

    }

    else {
      console.log('not found');
    }

  });
}

let starter = setInterval(do_loop, interval);

function kill_loop() {
  clearInterval(starter);
}


