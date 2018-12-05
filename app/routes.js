var Product       		= require('../app/models/product');
module.exports = function(app, passport, multer, db, ObjectId) {
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/artist', function(req, res) {
    res.render('artistProfile.ejs');
  });

  app.get('/product', function(req, res) {
    res.render('product.ejs');
  });

// SIGNUP ===============================================================
// show the signup form
  app.get('/signup', function(req, res) {
      res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

// PROFILE SECTION ======================================================
  app.get('/profile', isLoggedIn, function(req, res) {
    db.collection('users').findOne(req.user, (err, user) => {
      if (err) return console.log(err);
      res.render('profile.ejs', {user: req.user});
    });
  });
  app.post('/profile', (req, res) => {
      db.collection('users').findOneAndUpdate(req.user, {
        $set: {
          name : req.body.name,
          username : req.body.username,
          bio : req.body.bio,
          location : req.body.location
        }
      }, {
        // sorts the direction for bottom up or top bottom
        sort: {_id: 1},
        // if you cant find it, it makes it for you
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.redirect('/profile')
      })
    })

// LOGIN =================================================================
// show the login form
  app.get('/login', function(req, res) {
      res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  //---------------------------------------
  // PROFILE IMAGE CODE
  //---------------------------------------
  var storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'public/img/uploads')
      },
      filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + ".png")
      }
  });
  var upload = multer({storage: storage});

  app.post('/up', upload.single('file-to-upload'), (req, res, next) => {

      insertDocuments(db, req, 'img/uploads/' + req.file.filename, () => {
          //db.close();
          //res.json({'message': 'File uploaded successfully'});
          res.redirect('/profile')
      });
  });

  var insertDocuments = function(db, req, filePath, callback) {
      var collection = db.collection('users');
      var uId = ObjectId(req.session.passport.user)
      collection.findOneAndUpdate({"_id": uId}, {
        $set: {
          img: filePath
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        callback(result)
      })
      // collection.findOne({"_id": uId}, (err, result) => {
      //     //{'imagePath' : filePath }
      //     //assert.equal(err, null);
      //     callback(result);
      // });
  }
  //---------------------------------------
  // PROFILE IMAGE CODE END
  //---------------------------------------

  app.get('/productUpload', function(req, res) {
    res.render('productUpload.ejs');
  });

  //---------------------------------------
  // PRODUCT IMAGE CODE
  //---------------------------------------
  var storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'public/img/productUploads')
      },
      filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + ".png")
      }
  });
  var upload2 = multer({storage: storage});

  app.post('/up2', upload2.single('file-to-upload'), (req, res, next) => {
      var collection = db.collection('users');
      var newProduct = new Product({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        img: 'img/productUploads/' + req.file.filename,
        artist: req.user._id
      });
      collection.findOneAndUpdate({"_id": req.user._id}, {
        $push: {
          gallery: newProduct
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err) return res.send(err)
        res.redirect('/productUpload')
      })

  });
  //---------------------------------------
  // PRODUCT IMAGE CODE END
  //---------------------------------------



};


// route middleware to ensure user is logged in ==============================
function isLoggedIn(req, res, next) {
    console.log("yes");
    if (req.isAuthenticated())
        return next();
        else{res.redirect('/');}

}
