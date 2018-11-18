module.exports = function(app, passport, db) {
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  app.get('/artist', function(req, res) {
    res.render('artistProfile.ejs');
  });

  app.get('/product', function(req, res) {
    res.render('product.ejs');
  });
};
