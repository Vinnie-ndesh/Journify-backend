
import { Category } from "../models/journalModel.js";

const categories = [
  { categoryName: 'Personal' },
  { categoryName: 'Work' },
  { categoryName: 'Travel' },
  { categoryName: 'Health' },
  { categoryName: 'Finance' },
  { categoryName: 'Hobbies' },
  { categoryName: 'Education' },
  { categoryName: 'Technology' },
  { categoryName: 'Food' },
  { categoryName: 'Lifestyle' },
];

export const populateCategories = async ()=> {
  
  try {
    // Insert multiple categories into the 'Category' table
    await Category.bulkCreate(categories);
    console.log('Categories have been populated!');
  } catch (error) {
    console.error('Error populating categories:', error);
  }
}


