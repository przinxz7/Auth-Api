const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const calculateExpirationDate = (duration) => {
    const durations = {
        '1week': 7 * 24 * 60 * 60 * 1000,
        '1month': 30 * 24 * 60 * 60 * 1000,
        '3month': 90 * 24 * 60 * 60 * 1000,
        'permanent': 77777777 * 24 * 60 * 60 * 1000
    };

    if (!durations[duration]) {
        throw new Error('Duração inválida');
    }

    return new Date(Date.now() + durations[duration]);
};

router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.render('admin/dashboard', { users });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        req.flash('error_msg', 'Erro ao carregar usuários');
        res.redirect('/admin');
    }
});

router.post('/add-login', async (req, res) => {
    try {
        const { username, password, duration } = req.body;
        
        if (!username || !duration) {
            throw new Error('Username e duração são obrigatórios');
        }

        const expirationDate = calculateExpirationDate(duration);

        const newUser = new User({
            username,
            password: password || null,
            expirationDate,
            isKey: false
        });

        await newUser.save();
        req.flash('success_msg', 'Login adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar login:', error);
        req.flash('error_msg', 'Erro ao adicionar login: ' + error.message);
    }
    res.redirect('/admin');
});

router.post('/remove-login/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        req.flash('success_msg', 'Login removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover login:', error);
        req.flash('error_msg', 'Erro ao remover login: ' + error.message);
    }
    res.redirect('/admin');
});

router.post('/ban', async (req, res) => {
    try {
        const { identifier, type } = req.body;

        if (!identifier || !type) {
            throw new Error('Identificador e tipo são obrigatórios');
        }

        const query = type === 'hwid' ? { hwid: identifier } : { username: identifier };
        const user = await User.findOne(query);

        if (!user) {
            throw new Error(`${type} não encontrado`);
        }

        user.hwidBanned = true;
        await user.save();
        req.flash('success_msg', `${identifier} banido com sucesso!`);
    } catch (error) {
        console.error('Erro ao banir:', error);
        req.flash('error_msg', 'Erro ao banir: ' + error.message);
    }
    res.redirect('/admin');
});

router.post('/unban', async (req, res) => {
    try {
        const { identifier, type } = req.body;

        if (!identifier || !type) {
            throw new Error('Identificador e tipo são obrigatórios');
        }

        const query = type === 'hwid' ? { hwid: identifier } : { username: identifier };
        const user = await User.findOne(query);

        if (!user) {
            throw new Error(`${type} não encontrado`);
        }

        user.hwidBanned = false;
        await user.save();
        req.flash('success_msg', `${identifier} desbanido com sucesso!`);
    } catch (error) {
        console.error('Erro ao desbanir:', error);
        req.flash('error_msg', 'Erro ao desbanir: ' + error.message);
    }
    res.redirect('/admin');
});

router.post('/reset-hwid', async (req, res) => {
    try {
        const { hwid } = req.body;

        if (!hwid) {
            throw new Error('HWID é obrigatório');
        }

        const user = await User.findOne({ hwid });

        if (!user) {
            throw new Error('HWID não encontrado');
        }

        user.hwid = null;
        await user.save();
        req.flash('success_msg', 'HWID resetado com sucesso!');
    } catch (error) {
        console.error('Erro ao resetar HWID:', error);
        req.flash('error_msg', 'Erro ao resetar HWID: ' + error.message);
    }
    res.redirect('/admin');
});

router.post('/generate-key', async (req, res) => {
    try {
        const { duration } = req.body;

        if (!duration) {
            throw new Error('Duração é obrigatória');
        }

        const key = uuidv4();
        const expirationDate = calculateExpirationDate(duration);

        const newUser = new User({
            username: key,
            expirationDate,
            isKey: true,
            password: null,
            hwid: null
        });

        await newUser.save();
        req.flash('success_msg', `Key gerada com sucesso: ${key}`);
    } catch (error) {
        console.error('Erro ao gerar key:', error);
        req.flash('error_msg', 'Erro ao gerar key: ' + error.message);
    }
    res.redirect('/admin');
});

module.exports = router; 