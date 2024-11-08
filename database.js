const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('game_database', 'user', 'userpassword', {
    host: 'localhost',
    dialect: 'mysql',
});

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    matches: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

sequelize.sync();
module.exports = { sequelize, User };
