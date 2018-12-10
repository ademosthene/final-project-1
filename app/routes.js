var Product       		= require('../app/models/product');
module.exports = function(app, passport, multer, db, ObjectId) {
  // ====== MAIN ROUTES ========================================================

  // -- home page ----
  app.get('/', function(req, res) {
    var userCollection = db.collection('users');
    var productCollection = db.collection('products');
    productCollection.find().toArray((err, result) => {
      if (err) return console.log(err)
      userCollection.find().toArray((userErr, users) => {
        if (userErr) return console.log(userErr)
        res.render('index.ejs', {
          user : req.user,
          products: result,
          users: users
        })
      })
    })
  });
  // -- individual artist profile page -----
  app.get('/artist', function(req, res) {
    var userCollection = db.collection('users');
    var productCollection = db.collection('products');
    userCollection.findOne({_id: ObjectId(req.query.id)}, (err, artist) => {
      if (err) return console.log(err)
      productCollection.find({artist: ObjectId(artist._id)}).toArray((err, products) => {
        if (err) return console.log(err)
        res.render('artistProfile.ejs', {
          artist: artist,
          products: products
        })
      })
    })
  });
  // -- all artists -------------------------
  app.get('/artistCollection', function(req, res) {
    var userCollection = db.collection('users');
    userCollection.find().toArray((err, artists) => {
      if (err) return console.log(err)
      res.render('allArtists.ejs', {
        artists: artists
      })
    })
  });
  // -- all products ------------------------
  app.get('/productCollection', function(req, res) {
    var productCollection = db.collection('products');
    productCollection.find().toArray((err, products) => {
      if (err) return console.log(err)
      res.render('allProducts.ejs', {
        products: products
      })
    })
  });
  // -- individual product page -------------
  app.get('/product', function(req, res) {
    var userCollection = db.collection('users');
    var productCollection = db.collection('products');
    // using the right query parameter for find one function and console log.
    // find right property value pair
    productCollection.findOne({ _id: ObjectId(req.query.id)}, (err, product) => {
      if (err) return console.log(err)
      userCollection.findOne({ _id: ObjectId(product.artist)}, (err, artist) =>{
        if (err) return console.log(err)
        res.render('product.ejs', {
          product: product,
          artist: artist
        });
      })
    })
  });

  // ====== USER PROFILE SECTION =================================================
  // -- display logged in user profile -------------
  app.get('/profile', isLoggedIn, function(req, res) {
    db.collection('users').findOne(req.user, (err, user) => {
      if (err) return console.log(err);
      res.render('profile.ejs', {user: req.user});
    });
  });
  // -- update logged in user profile --------------
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
  // -- UPLOAD USER PROFILE IMAGE CODE ----------------------------------------
  // -- stores image file on local device/file path -----
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/img/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".jpg")
    }
  });
  var upload = multer({storage: storage});
  app.post('/up', upload.single('file-to-upload'), (req, res, next) => {
    insertDocuments(db, req, 'img/uploads/' + req.file.filename, () => {
      res.redirect('/profile')
    });
  });
  // -- stores file path in database ---------------------
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
  }

  // ====== PRODUCT UPLOAD SECTION ===============================================
  // -- display product upload page ------------
  app.get('/productUpload', function(req, res) {
    res.render('productUpload.ejs');
  });

  // -- UPLOAD PRODUCT IMAGE CODE ----------------------------------------
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/img/productUploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".jpg")
    }
  });
  var upload2 = multer({storage: storage});
  app.post('/up2', upload2.single('file-to-upload'), (req, res, next) => {
    var userCollection = db.collection('users');
    var productCollection = db.collection('products');
    // -- creates a new product object ------------------
    var newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      img: 'img/productUploads/' + req.file.filename,
      artist: req.user._id
    });
    // -- saves new product into the database -----------
    newProduct.save(function(err) {
      if (err)
      throw err;
    });
    // -- adds new product into artist product gallery --
    userCollection.findOneAndUpdate({"_id": req.user._id}, {
      $push: {
        gallery: newProduct.id
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      res.redirect('/productUpload')
    })

  });

  // ====== SIGNUP ===============================================================
  // -- show the signup form --------------
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });
  // -- process the signup form -----------
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // ===== LOGIN =================================================================
  // -- show the login form ---------------
  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });
  // -- process the login form ------------
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

};
// == route middleware to ensure user is logged in =============================
function isLoggedIn(req, res, next) {
  console.log("yes");
  if (req.isAuthenticated())
  return next();
  else{res.redirect('/');}
}
