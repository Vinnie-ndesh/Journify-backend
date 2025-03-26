import logger from "../utils/logger.js";
import Sentiment from "sentiment";
import moment from "moment";
import { Op } from "sequelize";
import sequelize from "../config/db.js"; 
import { Journal, Category } from "../models/journalModel.js";
const sentiment = new Sentiment();

const createJournal = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;

    const userId = req.currentUser.id;

    //check if category exists
    const category = await Category.findOne({
      where: {
        categoryId,
      },
    });
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    const newJournal = await Journal.create({
      title,
      content,
      categoryId,
      userId,
    });

    logger.info(
      `Journal created successfully for user: ${newJournal.journalId}`
    );

    return res.status(201).json({
      message: "Journal created successfully",
      data: newJournal,
    });
  } catch (error) {
    logger.error(`Error during journal creation: ${error.message}`, {
      stack: error.stack,
      details: error.errors || null,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getJournals = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    if (page<1){
      return res.status(400).json({
        message: "Invalid page number",
      });
    }
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const userId = req.currentUser.id;

    const journals = await Journal.findAll({
      where: {
        userId,
      },
      order: [
        ['createdAt', 'DESC'],
      ],
      include: {
        model: Category,
        attributes: ['categoryName'], 
      },

      limit,
      offset,
    });

    const totalJournal = await Journal.count({
      where: {
        userId,
      },
    });

    const modifiedJournals = journals.map(journal => {
      const categoryName = journal.Category ? journal.Category.categoryName : null; 
      return {
        ...journal.toJSON(),
        categoryName, 
        Category: undefined,
      };
    });

    logger.info(`Journals fetched successfully for user: ${userId}`);

    res.status(200).json({
      message: "Journals fetched successfully",
      data: modifiedJournals,
      pagination: {
        totalItems: totalJournal,
        totalPages: Math.ceil(totalJournal / limit),
        currentPage: parseInt(page),
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error fetching journals: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getJournalsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const userId = req.currentUser.id;

    const journals = await Journal.findAll({
      where: {
        userId,
        categoryId,
      },
      limit,
      offset,
    });

    const totalJournal = await Journal.count({
      where: {
        userId,
        categoryId,
      },
    });

    logger.info(`Journals fetched successfully for user: ${userId}`);

    res.status(200).json({
      message: "Journals fetched successfully",
      data: journals,
      pagination: {
        totalItems: totalJournal,
        totalPages: Math.ceil(totalJournal / limit),
        currentPage: parseInt(page),
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error(`Error fetching journals: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const editJournal = async (req, res) => {
  try {
    const { journalId } = req.params;
    const { title, content, categoryId } = req.body;

    const userId = req.currentUser.id;

    const journal = await Journal.findOne({
      where: {
        journalId,
        userId,
      },
    });

    if (!journal) {
      return res.status(404).json({
        message: "Journal not found",
      });
    }

    journal.title = title;
    journal.content = content;
    journal.categoryId = categoryId;

    await journal.save();

    logger.info(`Journal updated successfully for user: ${userId}`);

    return res.status(200).json({
      message: "Journal updated successfully",
      data: journal,
    });
  } catch (error) {
    logger.error(`Error updating journal: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const userId = req.currentUser.id;

    const journal = await Journal.findOne({
      where: {
        journalId,
        userId,
      },
    });

    if (!journal) {
      return res.status(404).json({
        message: "Journal not found",
      });
    }

    await journal.destroy();

    logger.info(`Journal deleted successfully for user: ${userId}`);

    return res.status(200).json({
      message: "Journal deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting journal: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getCategory = async (req, res) => {
  try {
    const categories = await Category.findAll();
    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    logger.error(`Error fetching categories: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//sumaries
const getDefaultDates = () => {
  const endDate = moment().endOf("day").toDate(); 
  const startDate = moment().subtract(7, "days").startOf("day").toDate(); 
  return { startDate, endDate };
};

const getEntryFrequency = async (startDate, endDate) => {
  try {
    const entries = await Journal.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"], 
        [sequelize.fn("COUNT", sequelize.col("journalId")), "entryCount"], 
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))], 
      order: [ 
        [sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"], 
      ],
    });

    return entries;
  } catch (error) {
    console.error("Error fetching entry frequency:", error);
    throw error; 
  }
};


const getCategoryDistribution = async () => {
  try {
    const categoryCounts = await Journal.findAll({
      attributes: [
        "categoryId",
        [sequelize.fn("COUNT", sequelize.col("journalId")), "entryCount"],
      ],
      group: ["categoryId"],
    });

    return categoryCounts;
  } catch (error) {
    console.error("Error fetching category distribution:", error);
    throw error;
  }
};

const getWordCountTrends = async (startDate, endDate) => {
  try {
    const wordCountTrends = await Journal.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [
          sequelize.fn("SUM", sequelize.fn("LENGTH", sequelize.col("content"))),
          "totalWords",
        ], 
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"], 
      ],
    });

    return wordCountTrends;
  } catch (error) {
    console.error("Error fetching word count trends:", error);
    throw error; // Ensure the error is propagated for further handling
  }
};


const getTimeOfDayWritingPatterns = async () => {
  try {
    const timePatterns = await Journal.findAll({
      attributes: [
        // Use EXTRACT correctly on the createdAt column to get the hour
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('journalId')), 'entryCount'],
      ],
      group: [sequelize.literal('EXTRACT(HOUR FROM "createdAt")')],
      order: [[sequelize.literal('EXTRACT(HOUR FROM "createdAt")'), 'ASC']],
    });

    return timePatterns;
  } catch (error) {
    console.error("Error fetching time-of-day patterns:", error);
    throw error;
  }
};


const getWordFrequency = async () => {
  try {
    const wordFrequency = await Journal.findAll({
      attributes: [
        [
          sequelize.fn(
            "REGEXP_REPLACE",
            sequelize.col("content"),
            "[^a-zA-Z ]",
            "",
            "g"
          ),
          "cleanContent",
        ],
      ],
    });

    const wordCount = {};

    wordFrequency.forEach((entry) => {
     
      const cleanContent = entry.get("cleanContent");
      if (cleanContent) {
        const words = cleanContent.split(" ");  
        words.forEach((word) => {
          word = word.toLowerCase(); 
          if (word.trim()) {  
            wordCount[word] = (wordCount[word] || 0) + 1;
          }
        });
      }
    });

    return wordCount;
  } catch (error) {
    console.error("Error fetching word frequency:", error);
    throw error;
  }
};


const analyzeMood = async () => {
  try {
    const journals = await Journal.findAll();
    const moodData = journals.map((entry) => {
      const result = sentiment.analyze(entry.content);
      return { date: entry.createdAt, sentimentScore: result.score };
    });

    return moodData;
  } catch (error) {
    console.error("Error analyzing mood:", error);
    throw error;
  }
};


const loadAllAnalysis = async (req, res) => {
  try {

    const { startDate, endDate } = req.query.startDate && req.query.endDate 
      ? { startDate: new Date(req.query.startDate), endDate: new Date(req.query.endDate) }
      : getDefaultDates();


    const entryFrequencyData = await getEntryFrequency(startDate, endDate);
    const categoryDistributionData = await getCategoryDistribution();
    const wordCountTrendsData = await getWordCountTrends(startDate, endDate);
    const timeOfDayWritingPatternsData = await getTimeOfDayWritingPatterns();
    const wordFrequencyData = await getWordFrequency();
    const moodData = await analyzeMood();

    // Return the fetched data as a response
    return res.status(200).json({
      message: "Analysis fetched successfully",
      data: {
        entryFrequencyData,
        categoryDistributionData,
        wordCountTrendsData,
        timeOfDayWritingPatternsData,
        wordFrequencyData,
        moodData,
      },
    });
  } catch (error) {
    console.error("Error in loading analysis:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export {
  createJournal,
  getJournals,
  getJournalsByCategory,
  editJournal,
  deleteJournal,
  getCategory,
  loadAllAnalysis,
};
