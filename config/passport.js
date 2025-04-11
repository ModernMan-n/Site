require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const VKontakteStrategy = require('passport-vkontakte').Strategy;
const User = require('../models/User');  // Убедись, что модель User существует


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // ищем пользователя в базе
    let existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
      console.log('Пользователь найден:', existingUser);
      return done(null, existingUser);
    }

    // если нет - создаем нового
    const newUser = new User({
      googleId: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value
    });

    const savedUser = await newUser.save();
    console.log('Новый пользователь создан:', savedUser);

    return done(null, savedUser);
  } catch (err) {
    console.error('Ошибка в стратегии Google:', err);
    return done(err, null);
  }
}));

passport.use(new VKontakteStrategy({
  clientID: process.env.VK_CLIENT_ID,
  clientSecret: process.env.VK_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/vk/callback'
},
  async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ vkId: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    } else {
      const user = new User({
        vkId: profile.id,
        displayName: profile.displayName,
        photo: profile.photos[0].value
      });
      await user.save();
      return done(null, user);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('Сериализация пользователя:', user); // логируем пользователя
  done(null, user.id); // сохраняем ID пользователя в сессию
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Десериализация пользователя:', user); // логируем из сессии
    done(null, user);
  } catch (err) {
    console.error('Ошибка при десериализации:', err);
    done(err, null);
  }
});
