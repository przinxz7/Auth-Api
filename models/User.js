const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username é obrigatório'],
        trim: true
    },
    password: { 
        type: String, 
        required: false,
        trim: true
    },
    hwid: { 
        type: String, 
        default: null,
        trim: true
    },
    expirationDate: { 
        type: Date, 
        required: [true, 'Data de expiração é obrigatória'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Data de expiração deve ser no futuro'
        }
    },
    hwidBanned: { 
        type: Boolean, 
        default: false 
    },
    isKey: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false 
});

mongoose.connection.once('open', async () => {
    try {
        await mongoose.connection.collection('users').dropIndexes();
    } catch (error) {
        console.log('Nenhum índice para remover');
    }
});

userSchema.pre('save', function(next) {
    if (this.username) this.username = this.username.trim();
    if (this.password) this.password = this.password.trim();
    if (this.hwid) this.hwid = this.hwid.trim();
    next();
});

module.exports = mongoose.model('User', userSchema); 