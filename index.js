const snoowrap = require('snoowrap'),
      request = require('request');

const mysub = 'barcasubdesign',
      regex = new RegExp('^#{5}[a-zA-Z0-9].*','gm'),
      interval = 60000;

const r = new snoowrap({
  userAgent: 'barca bot',
  clientId: process.argv[2],
  clientSecret: process.argv[3],
  refreshToken: process.argv[4]
});

console.log(process.argv);

function get_barca_unix(callback) {
  
  request('https://www.fcbarcelona.com/football/first-team/schedule', function (error, response, body) {

    if (error) {
      console.log('error:', error); // Print the error if one occurred
    }

    else {
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    
      var timestamp = body.match(/target_date.*/g);
      var timestamp = timestamp[0].split("'")[1];

      //set the date we're counting down to
      var target_date = timestamp;
      var days, hours, minutes, seconds;
    
      // find the amount of "seconds" between now and target
      var current_date = new Date().getTime();
      var seconds_left = (target_date - current_date) / 1000;
    
      // do some time calculations
      days = parseInt(seconds_left / 86400);
      seconds_left = seconds_left % 86400;
      hours = parseInt(seconds_left / 3600);
      seconds_left = seconds_left % 3600;
      minutes = parseInt(seconds_left / 60);
      seconds = parseInt(seconds_left % 60);

      var final = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

      callback(final);
    }
  });
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
        var new_sidebar = current_sidebar.replace(regex,'#####' + date);
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


