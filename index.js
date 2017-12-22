const snoowrap = require('snoowrap'),
      request = require('request');

const mysub = 'barcasubdesign',
      regex = new RegExp('(^#{5}[a-zA-Z0-9(*].*\n)','gm');

var interval = 900000;

//Note: Reddit doesn't show an entry to the mod log if the previous entry is the same as the last one.

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
      console.log(`next loop in ${(interval / 1000) / 60} minutes`);

      setTimeout(function(){ do_loop(); }, interval);
    }

    else {
   
      let timestamp = body.match(/target_date.*/g);
      let final = timestamp_to_code(timestamp);

      console.log(`\n${final}`);

      callback(final);
    }
  });
}

function timestamp_to_code(timestamp) {

  let current_date = new Date().getTime();
  let target_date = parseInt(timestamp[0].split("'")[1]);

  console.log(`\ncurrent time: ${current_date}`);
  console.log(`match time: ${target_date}`);

  let difference = (target_date - current_date) / 1000;

  console.log(`difference is ${difference} seconds\n`);

  let days, hours, minutes, seconds;
  let seconds_left = (target_date - current_date) / 1000;

  days = parseInt(seconds_left / 86400);
  seconds_left = seconds_left % 86400;
  hours = parseInt(seconds_left / 3600);
  seconds_left = seconds_left % 3600;
  minutes = parseInt(seconds_left / 60);
  seconds = parseInt(seconds_left % 60);

  let days_plural = (days != 1 ? "days" : "day");
  let hours_plural = (hours != 1 ? "hours" : "hour");
  let minutes_plural = (minutes != 1 ? "minutes" : "minute");

  if (difference <= 0) {
    console.log('match under way. sleeping for 110 minutes.');

    interval = 6600000;
    let final = `#####Next match in: **Match currently is progress**\n`;
    return final;
  }

  else if (difference <= 21600) {
    console.log('6 hrs or less remaining. setting interval to 15 minutes.');

    interval = 900000;
    let final = `#####Next match in: **${hours}** ${hours_plural} **${minutes}** ${minutes_plural}\n`;
    return final;
  }

  else if (difference <= 86400 && difference >= 21600) {
    console.log('6 to 24 hours remaining. removing days and adding minutes.');
    
    interval = 3600000;
    let final = `#####Next match in: **${hours}** ${hours_plural} **${minutes}** ${minutes_plural}\n`;
    return final;    
  }

  else if (difference >= 21600) {
    console.log('more than 6 hours remaining. setting interval to 1 hour.');

    interval = 3600000;
    let final = `#####Next match in: **${days}** ${days_plural} **${hours}** ${hours_plural}\n`;
    return final;
  }
}

function get_sidebar(callback) {
  r.getSubreddit(mysub).getSettings().then(function(data) {
    callback(data);
  })
}

function do_loop() {
  get_sidebar(function(data){

    if (data.description.match(regex)) {

      get_barca_unix(function(result) {
        let current_sidebar = data.description;
        let new_sidebar = current_sidebar.replace(regex,result);

        r.getSubreddit(mysub).editSettings({ description: new_sidebar }).then(function(){
          console.log(`next loop in ${(interval / 1000) / 60} minutes`);
          setTimeout(function(){ do_loop(); }, interval);
        });
      })
    }

    else {
      console.log('timer not found on sidebar.');
      console.log(`next loop in ${(interval / 1000) / 60} minutes`);

      setTimeout(function(){ do_loop(); }, interval);
    }

  });
}

do_loop();

