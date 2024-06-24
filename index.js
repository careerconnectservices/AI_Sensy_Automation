const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./config/logger-config");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { SERVER_PORT, MAIL_SETTINGS } = require("./constants/constants");

require("dotenv").config(); // Load environment variables

const app = express();

// Basic security enhancements
app.use(helmet()); // Sets various HTTP headers to help protect your app.
app.use(cors()); // Enable CORS with default settings.
app.use(express.json()); // Middleware to parse JSON
app.set("trust proxy", true);
// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: function (req /*, res*/) {
    return req.ip; // Using the IP determined by Express, which respects the 'trust proxy' setting
  },
});

app.use(limiter);

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
    name: "UPTAC/UPCET/UPSEE Top Colleges: IET, KNIT, JSS, BIET, AKGEC, AITH, KIET, ABESEC, GL BAJAJ, GALGOTIA College(Main Campus not University which is bad), NIET",
    crlRankAllIndia: 1400000,
    percentileAllIndia: 0,
    percentileHomeState: 0, // Home state not present, so copying All India
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
    name: "MP-DTE Top Colleges: SGITS, IET-DAVV, JEC-Jabalpul, MITS-Gwalior, LNCT Main Campus(1992), Oriental Institute of Science & Technology, Bhopal (1995)",
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

  {
    name: "REAP/MBM/RTU Kota/SKITS",
    crlRankAllIndia: 500000,
    percentileAllIndia: 64.28571429,
    crlRankHomeState: 600000,
    percentileHomeState: 57.14285714,
  },
  {
    name: "HSTES/JC Bose/DBCR",
    crlRankAllIndia: 300000,
    percentileAllIndia: 78.57142857,
    crlRankHomeState: 400000,
    percentileHomeState: 71.42857143,
  },
  {
    name: "MHT-CET",
    crlRankAllIndia: 100000,
    percentileAllIndia: 92.85714286,
    crlRankHomeState: 200000,
    percentileHomeState: 85.71428571,
  },

  {
    name: "WB-JEE",
    crlRankAllIndia: 500000,
    percentileAllIndia: 64.28571429,
    percentileHomeState: 54.28571429, // Home state not present, so copying All India
  },
];

const counselingIPUChoiceFillingData = [
  {
    Choice_No: 1,
    Institute_Type: "GOVT",
    Institute_Name:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program_Name: "Computer Science & Engineering (Dual Degree)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 2,
    Institute_Type: "GOVT",
    Institute_Name:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program_Name: "Information Technology (Dual Degree)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 3,
    Institute_Type: "GOVT",
    Institute_Name:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program_Name: "Electronics & Communication Engineering (Dual Degree)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 4,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 5,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Computer Science & Engineering (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 6,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "CSE- AIML",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 7,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "CSE - AI",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 8,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "CSE- DS",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 9,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Computer Science & Technology",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 10,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 11,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Information Technology and Engineering",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 12,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 13,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Computer Science & Engineering (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 14,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 15,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Information Technology (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 16,
    Institute_Type: "Private",
    Institute_Name: "Bharati Vidyapeeth's College of Engineering",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 17,
    Institute_Type: "Private",
    Institute_Name: "Bharati Vidyapeeth's College of Engineering",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 18,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Electronics & Communication Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 19,
    Institute_Type: "Private",
    Institute_Name:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi-110085",
    Program_Name: "Computer Science & Engineering",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 20,
    Institute_Type: "Private",
    Institute_Name:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi-110085",
    Program_Name: "CSE- DS",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 21,
    Institute_Type: "Private",
    Institute_Name:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi-110085",
    Program_Name: "Information Technology",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 22,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Electronics & Comm.- Advance Comm. Technology",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 23,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Electronics Engg.- VLSI Design & Technology",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 24,
    Institute_Type: "GOVT",
    Institute_Name: "University School of Automation & Robotics",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 25,
    Institute_Type: "GOVT",
    Institute_Name: "University School of Automation & Robotics",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 26,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Electronics & Communication Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 27,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Electronics & Communication Engineering (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 28,
    Institute_Type: "Private",
    Institute_Name:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block",
    Program_Name: "Computer Science & Engineering",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 29,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 30,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Computer Science & Engineering (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 31,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Computer Science & Technology",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 32,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "CS",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 33,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 34,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Information Technology (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 35,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 36,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "Computer Science & Engineering (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 37,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "CSE- AIML",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 38,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "CSE- DS",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 39,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 40,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "Information Technology (Shift II)",
    JEEMainsRank: 70000,
  },
  {
    Choice_No: 41,
    Institute_Type: "Private",
    Institute_Name: "Bharati Vidyapeeth's College of Engineering",
    Program_Name: "Electronics & Communication Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 42,
    Institute_Type: "Private",
    Institute_Name:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi-110085",
    Program_Name: "Electronics & Communication Engineering",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 43,
    Institute_Type: "Private",
    Institute_Name:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 44,
    Institute_Type: "Private",
    Institute_Name:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 45,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 46,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 47,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Machine Learning (Shift II)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 48,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Data Science (Shift II)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 49,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Electronics & Communication Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 50,
    Institute_Type: "Private",
    Institute_Name:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management",
    Program_Name: "Electronics & Communication Engineering (Shift II)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 51,
    Institute_Type: "Private",
    Institute_Name: "Guru Teg Bahadur Institute of Technology",
    Program_Name: "Electronics & Communication Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 52,
    Institute_Type: "Private",
    Institute_Name:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program_Name: "Electrical & Electronics Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 53,
    Institute_Type: "Private",
    Institute_Name: "Maharaja Surajmal Institute Technology",
    Program_Name: "Electrical & Electronics Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 54,
    Institute_Type: "GOVT",
    Institute_Name: "University School of Automation & Robotics",
    Program_Name: "Industrial Internet of Things",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 55,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "Computer Science & Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 56,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "Computer Science & Engineering (Shift II)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 57,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "Information Technology (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 58,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "CSE (Cyber Security)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 59,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 60,
    Institute_Type: "Private",
    Institute_Name: "HMR Institute of Technology & Management",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 61,
    Institute_Type: "Private",
    Institute_Name: "Bharati Vidyapeeth's College of Engineering",
    Program_Name: "Electrical & Electronics Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 62,
    Institute_Type: "Private",
    Institute_Name:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi-110085",
    Program_Name: "Electrical & Electronics Engineering",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 63,
    Institute_Type: "GOVT",
    Institute_Name: "University School of Automation & Robotics",
    Program_Name: "Automation & Robotics",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 64,
    Institute_Type: "Private",
    Institute_Name: "Bharati Vidyapeeth's College of Engineering",
    Program_Name: "Instrumentation & Control Engineering (Shift I)",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 65,
    Institute_Type: "Private",
    Institute_Name:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block",
    Program_Name: "Industrial Internet of Things",
    JEEMainsRank: 400000,
  },
  {
    Choice_No: 66,
    Institute_Type: "Private",
    Institute_Name: "Greater Noida Institute of Technology",
    Program_Name: "Computer Science & Engineering",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 67,
    Institute_Type: "Private",
    Institute_Name:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program_Name: "Computer Science & Engineering",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 68,
    Institute_Type: "Private",
    Institute_Name: "Greater Noida Institute of Technology",
    Program_Name: "Information Technology",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 69,
    Institute_Type: "Private",
    Institute_Name:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program_Name: "Computer Science & Engineering",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 70,
    Institute_Type: "Private",
    Institute_Name:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 71,
    Institute_Type: "Private",
    Institute_Name:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 72,
    Institute_Type: "Private",
    Institute_Name:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program_Name: "Artificial Intelligence & Machine Learning",
    JEEMainsRank: 1400000,
  },
  {
    Choice_No: 73,
    Institute_Type: "Private",
    Institute_Name:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program_Name: "Artificial Intelligence & Data Science",
    JEEMainsRank: 1400000,
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
        const meetsAllIndia = percentile >= counseling.percentileAllIndia;
        const meetsHomeState =
          !counseling.percentileHomeState || counseling.name === domicileState
            ? meetsAllIndia
            : percentile >= counseling.percentileHomeState;

        return meetsAllIndia || meetsHomeState;
      })
      .map((counseling) => counseling.name);

    console.log("Recommendations:", recommendations); // Log filtered recommendations

    const recommendationList = recommendations.join("------");
    res.json({
      success: true,
      message:
        "Recommended counseling processes based on provided percentile and domicile state are below:",
      data: recommendationList || "No eligible counseling processes found.",
    });
  } catch (error) {
    console.error("Error:", error.stack); // Detailed error log
    res
      .status(500)
      .json({ success: false, message: "Error processing request." });
  }
});

// Secure email sending route
app.post("/send_email", async (req, res) => {
  const { to, subject, text } = req.body;
  const transporter = nodemailer.createTransport(MAIL_SETTINGS);

  try {
    let info = await transporter.sendMail({
      from: `"Career Connect Services" <${MAIL_SETTINGS.auth.user}>`,
      to: to,
      subject: subject,
      text: text,
    });

    logger.info("Message sent: %s", info.messageId);
    res.send({ success: true, messageId: info.messageId });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ success: false, message: "Failed to send email" });
  }
});

// IPU choice filling with enhanced input validation and error handling
app.post("/ipu_choice_filling", (req, res) => {
  try {
    const { jeemainsRank, FromWhereyouhavecompletedyou12thClass } = req.body;

    // Filter data based on provided criteria
    let filteredData = counselingIPUChoiceFillingData.filter(
      (item) =>
        FromWhereyouhavecompletedyou12thClass.toLowerCase() === "delhi" &&
        jeemainsRank <= item.JEEMainsRank
    );

    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    // Set headers for downloading the PDF
    res.setHeader(
      "Content-disposition",
      'attachment; filename="choice_filling.pdf"'
    );
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // Set title and headers
    doc
      .fontSize(16)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("Career Connect Service Free Choice Filling for IPU", 50, 30, {
        align: "center",
        underline: true,
      });

    const headers = ["S. No", "Type", "Institute Name", "Program Name"];
    const columnWidths = [50, 80, 390, 390];
    const startY = 100;
    let yPosition = startY;

    // Function to draw headers
    function drawHeaders(doc, headers, yPosition, columnWidths) {
      doc.fontSize(10).fillColor("blue").font("Helvetica-Bold");
      let xPosition = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPosition, yPosition, {
          width: columnWidths[i],
          align: "center",
        });
        xPosition += columnWidths[i];
      });
    }

    // Draw headers initially
    drawHeaders(doc, headers, yPosition, columnWidths);
    yPosition += 25; // Adjust y-position for content

    // Function to add rows of data to the PDF
    filteredData.forEach((item, index) => {
      let rowHeight = Math.max(
        calculateTextHeight(doc, item.Institute_Name, columnWidths[2], 10),
        calculateTextHeight(doc, item.Program_Name, columnWidths[3], 10),
        20
      );

      if (yPosition + rowHeight > doc.page.height - 50) {
        doc.addPage();
        yPosition = 50; // Reset yPosition for new page
        drawHeaders(doc, headers, yPosition, columnWidths);
        yPosition += 25;
      }

      let fillColor = index % 2 === 0 ? "#EEEEEE" : "#FFFFFF";
      let xPosition = 50;
      doc
        .rect(
          xPosition,
          yPosition,
          columnWidths.reduce((a, b) => a + b, 0),
          rowHeight
        )
        .fill(fillColor);
      doc.fontSize(10).fillColor("#000000");

      [
        index + 1,
        item.Institute_Type,
        item.Institute_Name,
        item.Program_Name,
      ].forEach((text, i) => {
        doc.text(text.toString(), xPosition, yPosition + (rowHeight - 12) / 2, {
          width: columnWidths[i],
          align: "left",
        });
        xPosition += columnWidths[i];
      });

      yPosition += rowHeight;
    });

    doc.end(); // Finalize the PDF and end the stream
  } catch (error) {
    logger.error("Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing request." });
  }
});

// Helper function to calculate text height for proper wrapping
function calculateTextHeight(doc, text, width, fontSize) {
  doc.font("Helvetica").fontSize(fontSize);
  const words = text.split(" ");
  let line = "";
  let lines = 1;
  words.forEach((word) => {
    const testLine = line + word + " ";
    if (doc.widthOfString(testLine) > width) {
      lines++;
      line = word + " ";
    } else {
      line = testLine;
    }
  });
  return lines * (fontSize * 1.5); // Estimated line height
}

// app.get("/list-files", (req, res) => {
//   const directoryPath = path.join(__dirname); // Adjust the path as needed
//   fs.readdir(directoryPath, (err, files) => {
//     if (err) {
//       console.error("Failed to list files:", err);
//       return res.status(500).send("Failed to list files");
//     }

//     // Use a map to collect file stats promises
//     let statsPromises = files.map(file => {
//       return new Promise((resolve, reject) => {
//         const filePath = path.join(directoryPath, file);
//         fs.stat(filePath, (err, stats) => {
//           if (err) {
//             reject(`Error retrieving file stats for ${file}: ${err}`);
//           } else {
//             resolve({ file, stats });
//           }
//         });
//       });
//     });

//     // Wait for all stats to be collected
//     Promise.all(statsPromises)
//       .then(results => {
//         // Prepare a detailed list with file stats
//         const detailedFiles = results.map(result => {
//           return { name: result.file, stats: result.stats };
//         });
//         res.send(detailedFiles);
//       })
//       .catch(statsError => {
//         console.error("Error retrieving stats for files:", statsError);
//         res.status(500).send("Error retrieving file stats");
//       });
//   });
// });

// Global error handler

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || SERVER_PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
