import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
 
    status: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        comment: '0 = Inactive, 1 = Active',
        defaultValue: '1',
    },
    failedAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lockTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    }, {
    tableName: 'users',
    timestamps: true,


});

export default User;
