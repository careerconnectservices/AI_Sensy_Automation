const express = require("express");
const logger = require("./config/logger");

require("dotenv").config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON

const counselingData = [
  {
    name: "JOSAA",
    crlRankAllIndia: 100000,
    percentileAllIndia: 92.85714286,
    crlRankHomeState: 100000,
    percentileHomeState: 92.85714286,
  },
  {
    name: "CSAB",
    crlRankAllIndia: 250000,
    percentileAllIndia: 82.14285714,
    crlRankHomeState: 250000,
    percentileHomeState: 82.14285714,
  },
  {
    name: "JAC Delhi",
    crlRankAllIndia: 200000,
    percentileAllIndia: 85.71428571,
    crlRankHomeState: 100000,
    percentileHomeState: 92.85714286,
  },
  {
    name: "IPU",
    crlRankAllIndia: 300000,
    percentileAllIndia: 78.57142857,
    crlRankHomeState: 150000,
    percentileHomeState: 89.28571429,
  },
  {
    name: "JAC Chandigarh",
    crlRankAllIndia: 500000,
    percentileAllIndia: 64.28571429,
    crlRankHomeState: 500000,
    percentileHomeState: 64.28571429,
  },
  {
    name: "JAYPEE NOIDA",
    crlRankAllIndia: 300000,
    percentileAllIndia: 78.57142857,
    percentileHomeState: 78.57142857, // Home state not present, so copying All India
  },
  {
    name: "UPTAC/UPCET/UPSEE (Top 10 Colleges)",
    crlRankAllIndia: 220000,
    percentileAllIndia: 84.28571429,
    percentileHomeState: 84.28571429, // Home state not present, so copying All India
  },
  {
    name: "MMMUT",
    crlRankAllIndia: 150000,
    percentileAllIndia: 89.28571429,
    crlRankHomeState: 200000,
    percentileHomeState: 85.71428571,
  },
  {
    name: "HBTU",
    crlRankAllIndia: 120000,
    percentileAllIndia: 91.42857143,
    crlRankHomeState: 150000,
    percentileHomeState: 89.28571429,
  },
  {
    name: "MP-DTE (Main Campus)",
    crlRankAllIndia: 400000,
    percentileAllIndia: 71.42857143,
    crlRankHomeState: 1000000,
    percentileHomeState: 28.57142857,
  },
  {
    name: "BIT MESRA/PATNA/DEOGHAR/JAIPUR",
    crlRankAllIndia: 600000,
    percentileAllIndia: 57.14285714,
    percentileHomeState: 57.14285714, // Home state not present, so copying All India
  },
  {
    name: "LMNIIT",
    crlRankAllIndia: 100000,
    percentileAllIndia: 92.85714286,
    percentileHomeState: 92.85714286, // Home state not present, so copying All India
  },
  {
    name: "THAPAR",
    crlRankAllIndia: 250000,
    percentileAllIndia: 82.14285714,
    percentileHomeState: 82.14285714, // Home state not present, so copying All India
  },
  // ... existing entries ...

  {
    name: "REAP/MBM/RTU Kota/SKITS",
    crlRankAllIndia: undefined,
    percentileAllIndia: 100,
    crlRankHomeState: undefined,
    percentileHomeState: 100,
  },
  {
    name: "HSTES/JC Bose/DBCR",
    crlRankAllIndia: undefined,
    percentileAllIndia: 100,
    crlRankHomeState: undefined,
    percentileHomeState: 100,
  },
  {
    name: "MHT-CET",
    crlRankAllIndia: 100000,
    percentileAllIndia: 92.85714286,
    crlRankHomeState: undefined,
    percentileHomeState: 92.85714286,
  },
  {
    name: "WB-JEE",
    crlRankAllIndia: 500000,
    percentileAllIndia: 64.28571429,
    crlRankHomeState: undefined,
    percentileHomeState: 64.28571429,
  },
  // ... include any other specific counseling entries that you have data for ...

  {
    name: "WB-JEE",
    crlRankAllIndia: 500000,
    percentileAllIndia: 64.28571429,
    percentileHomeState: 64.28571429, // Home state not present, so copying All India
  },
];

/**
 * Processes BTech counseling recommendations based on student attributes.
 *
 * This function receives student attributes via the request body and determines the most appropriate
 * counseling session for BTech college admissions in India. It evaluates attributes like domicile state,
 * academic performance, and JEE results. Based on these attributes, it recommends either national-level
 * JEE Mains counseling through JoSAA or state-level counseling, aiming to maximize the student's chances
 * of admission into top engineering colleges.
 *
 * @param {object} req The request object from Express.js, containing student attributes.
 * @param {object} res The response object from Express.js, used to send the HTTP response.
 * @returns {object} An object containing a success flag, message, and the recommended counseling process.
 *
 * @apiExample {json} Request-Example:
 *     {
 *       "attributes": [
 *         {"value": "Maharashtra", "name": "DomicileState"},
 *         {"value": "Delhi", "name": "FromWhereyouhavecompletedyou12thClass"},
 *         {"value": "Male", "name": "Gender"},
 *         {"value": "OBC", "name": "Category"},
 *         {"value": "98.5", "name": "Jeepercentile"},
 *         {"value": "1500", "name": "JEEMainsRank"},
 *         {"value": "92", "name": "Class12thPCMPercentage"},
 *         {"value": "89", "name": "Class12thAggregatePercentageofTop5Subjects"}
 *       ]
 *     }
 *
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "message": "Recommended counseling process received.",
 *   "recommendation": "Attend JEE Mains counseling through JoSAA for the best chance at top engineering colleges in India."
 * }
 *
 * // Possible error response:
 * {
 *   "success": false,
 *   "message": "Error processing request. Please check the input data and try again."
 * }
 *
 * @author Amit Singh
 */

// Endpoint to determine counseling eligibility
app.post("/counseling", (req, res) => {
  try {
    const { percentile, domicileState } = req.body;
    const recommendations = counselingData
      .filter((counseling) => {
        // Check if the percentile meets the All India or Home State requirement
        const meetsAllIndia = percentile >= counseling.percentileAllIndia;
        const meetsHomeState =
          !counseling.percentileHomeState || counseling.name === domicileState
            ? meetsAllIndia
            : percentile >= counseling.percentileHomeState;

        return meetsAllIndia || meetsHomeState;
      })
      .map((counseling) => counseling.name);

    res.json({
      success: true,
      message:
        `Recommended counseling processes based on provided percentile and domicile state ${recommendations}`
    });
  } catch (error) {
    logger.error(error.stack);
    res
      .status(500)
      .json({ success: false, message: "Error processing request." });
  }
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
