const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', (req, res) => {
    if (req.session.isAuthenticated) {
        return res.redirect('/admin');
    }
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAuthenticated = true;
        req.flash('success_msg', 'Login realizado com sucesso!');
        res.redirect('/admin');
    } else {
        req.flash('error_msg', 'Usuário ou senha incorretos');
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router; 