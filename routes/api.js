const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Função para verificar a chave de API
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_SECRET) {
        return res.status(401).json({ 
            status: "failed", 
            message: "Invalid API key" 
        });
    }
    next();
};

// Rota de inicialização (similar ao KeyAuth init)
router.post('/init', verifyApiKey, async (req, res) => {
    try {
        const { name, version } = req.body;
        
        // Verificar versão do aplicativo
        const expectedVersion = process.env.APP_VERSION || "1.0";
        if (version !== expectedVersion) {
            return res.json({
                status: "failed",
                message: "outdated",
                download: process.env.UPDATE_URL || ""
            });
        }

        res.json({
            status: "success",
            message: "initialized",
            sessionid: crypto.randomBytes(32).toString('hex')
        });
    } catch (error) {
        console.error('Erro na inicialização:', error);
        res.json({ status: "failed", message: error.message });
    }
});

// Rota de login
router.post('/login', verifyApiKey, async (req, res) => {
    try {
        const { username, hwid } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.json({ 
                status: "failed", 
                message: "invalid_username" 
            });
        }

        // Verificar se está banido
        if (user.hwidBanned) {
            return res.json({ 
                status: "failed", 
                message: "hwid_banned" 
            });
        }

        // Verificar expiração
        if (user.expirationDate < new Date()) {
            return res.json({ 
                status: "failed", 
                message: "subscription_expired" 
            });
        }

        // Se não tiver HWID, registra o primeiro
        if (!user.hwid) {
            user.hwid = hwid;
            await user.save();
        }
        // Verifica se o HWID corresponde
        else if (user.hwid !== hwid) {
            return res.json({ 
                status: "failed", 
                message: "invalid_hwid" 
            });
        }

        res.json({
            status: "success",
            message: "logged_in",
            expiry: user.expirationDate
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.json({ status: "failed", message: error.message });
    }
});

// Rota de registro de key
router.post('/register', verifyApiKey, async (req, res) => {
    try {
        const { key, hwid } = req.body;

        const user = await User.findOne({ 
            username: key,
            isKey: true 
        });

        if (!user) {
            return res.json({ 
                status: "failed", 
                message: "invalid_key" 
            });
        }

        if (user.hwid) {
            return res.json({ 
                status: "failed", 
                message: "key_already_used" 
            });
        }

        user.hwid = hwid;
        await user.save();

        res.json({
            status: "success",
            message: "key_registered",
            expiry: user.expirationDate
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.json({ status: "failed", message: error.message });
    }
});

module.exports = router; 