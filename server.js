
const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');

require('./config/passport');
const User = require('./models/User');
const paymentRoutes = require('./routes/payment');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
const PORT = 3000;
app.use(express.urlencoded({ extended: true }));  // Для обработки данных формы
app.use(express.json());  // Для обработки JSON данных

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Подключаемся к MongoDB
mongoose.connect('mongodb://localhost:27017/auth_example', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB подключен'))
  .catch(err => console.log(err));


app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/payment', paymentRoutes);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Google OAuth
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// VK OAuth
app.get('/auth/vk',
  passport.authenticate('vkontakte')
);

// VK OAuth callback
app.get('/auth/vk/callback',
  passport.authenticate('vkontakte', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Страница личного кабинета
app.get('/profile', isLoggedIn, (req, res) => {
  // Отправляем данные пользователя в шаблон
  res.render('profile', {
    user: req.user // Данные пользователя, полученные через Passport
  });
});

// Middleware для проверки, что пользователь авторизован
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}

// Выход из системы
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/topup', (req, res) => {
  res.render('topup');
});


//Юкасса
app.get('/payment-success', async (req, res) => {
  const { userId, amount } = req.query;
  const user = await User.findById(userId);
  if (user) {
    user.balance += parseFloat(amount);
    await user.save();
  }
  res.redirect('/');
});


app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.send(`<h1>Привет, ${req.user.displayName}</h1><a href="/logout">Выйти</a>`);
});

app.get('/', (req, res) => {
  const user = req.user;
  res.render('index', { user });
});

app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
