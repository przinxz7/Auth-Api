require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
const expressLayouts = require('express-ejs-layouts');

const app = express();

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB conectado com sucesso!');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.isAuthenticated = req.session.isAuthenticated;
    res.locals.moment = moment;
    next();
});

const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    req.flash('error_msg', 'Você precisa estar logado para acessar esta página');
    res.redirect('/login');
};

app.use('/', require('./routes/auth'));
app.use('/admin', isAuthenticated, require('./routes/admin'));

app.use('/api', require('./routes/api'));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            status: "failed", 
            message: "endpoint_not_found" 
        });
    }
    res.status(404).render('404');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 