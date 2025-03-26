import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './userModel.js';

// Define the 'Category' model
const Category = sequelize.define('Category', {
  categoryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'categories', // Table name is plural
  timestamps: true, // To enable createdAt and updatedAt fields
});

// Define the 'Journal' model
const Journal = sequelize.define('Journal', {
  journalId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Ensure reference is made to the User model
      key: 'userId',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category, // Correct reference to 'Category' model
      key: 'categoryId',
    },
  },
}, {
  tableName: 'journals',
  timestamps: true,
});

// Define associations
Journal.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Journal, { foreignKey: 'categoryId' });

Journal.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Journal, { foreignKey: 'userId' });

// Export the models for use in other parts of the application
export { Journal, Category };
