var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

// var cookieParser = require('cookie-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


/*** creating a session object ***/
app.use(session({
  secret: 'notASecret',
  saveUninitialized: false,
  resave: false
}));


app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    res.redirect('/');
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  // get username and password from req
  var username = req.body.username;
  var password = req.body.password;
  // store username and password in database
  new User({username: username, password: password})
    .save().then(function() {
      // redirect to '/'
      res.redirect('/');
    });
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  // check if user exists in database
  console.log('**** post /login inside');
  new User({username: username, password: password})
    .fetch().then(function(user) {
      if (user) {
        // if user exists in db, create or regenerate new session
        util.createSession(req, res, function() {
          // then redirect them to homepage
          res.redirect('/');
        });
      } else {
        // if user doesn't exist, take them back to login
        res.redirect('/login');
      }
    })
    .catch(function(err) {
      console.log('Error, can\'t fetch user: ', err);
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
