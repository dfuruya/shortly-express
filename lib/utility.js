var request = require('request');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.createSession = function(req, res, next) {
  return req.session.regenerate(function(){
    req.session.user = req.body.username;
    next();
  });
};

exports.checkUser = function(req, res, next) {
  if (req.session.user) {
    console.log('>>>>>>>>>>>>>> checkUser: LOGGED IN');
    next();
  } else {
    console.log('>>>>>>>>>>>>>> checkUser: NOT logged in');
    res.redirect('/login');
  }
};

// exports.hashPassword = function(pass, next) {
//   bcrypt.hash(pass, saltRounds, function(err, hashed) {
//     // Store hash in your password DB.
//     next(hashed);
//   });
// };

// exports.checkPassword = function(pass, req, next) {
//   bcrypt.compare(pass, req.get('user'), function(err, res) {
//     if (err) { throw err; }
//     next(hash);
//   });
// };
