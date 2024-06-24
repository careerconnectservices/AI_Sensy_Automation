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
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Computer Science & Engineering (Dual Degree)",
    Quota: "OS",
    Closing_Rank: 22997,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Information Technology (Dual Degree)",
    Quota: "OS",
    Closing_Rank: 26268,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 31844,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 36793,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Electronics & Communication Engineering (Dual Degree)",
    Quota: "OS",
    Closing_Rank: 39790,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Computer Science & Engineering (Dual Degree)",
    Quota: "HS",
    Closing_Rank: 42640,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Technology",
    Quota: "OS",
    Closing_Rank: 45462,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE - AI",
    Quota: "OS",
    Closing_Rank: 49156,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 49712,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 50516,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE- AIML",
    Quota: "OS",
    Closing_Rank: 50580,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE- DS",
    Quota: "OS",
    Closing_Rank: 51035,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Information Technology and Engineering",
    Quota: "OS",
    Closing_Rank: 51524,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 53327,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Information Technology (Dual Degree)",
    Quota: "HS",
    Closing_Rank: 53406,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 55825,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Information Technology (Shift II)",
    Quota: "OS",
    Closing_Rank: 56968,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 59450,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 60501,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 61152,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 61196,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 62641,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "CSE- DS",
    Quota: "OS",
    Closing_Rank: 64050,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Information Technology",
    Quota: "OS",
    Closing_Rank: 64756,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics & Comm.- Advance Comm. Technology",
    Quota: "OS",
    Closing_Rank: 65237,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 66109,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics Engg.- VLSI Design & Technology",
    Quota: "OS",
    Closing_Rank: 67104,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 67761,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 68300,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electronics & Communication Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 69626,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Information & Communication Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Electronics & Communication Engineering (Dual Degree)",
    Quota: "HS",
    Closing_Rank: 70012,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 70252,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 71198,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 73644,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Electronics & Communication Engineering",
    Quota: "OS",
    Closing_Rank: 75326,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Automation & Robotics",
    Quota: "OS",
    Closing_Rank: 77048,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Industrial Internet of Things",
    Quota: "OS",
    Closing_Rank: 77548,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 79093,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 79241,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Mechanical & Automation Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 79920,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 81861,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 83024,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 83257,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 85476,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Electrical & Electronics Engineering",
    Quota: "OS",
    Closing_Rank: 85661,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Technology",
    Quota: "OS",
    Closing_Rank: 87488,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 87737,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 89549,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Information Technology (Shift II)",
    Quota: "OS",
    Closing_Rank: 89624,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE- AIML",
    Quota: "HS",
    Closing_Rank: 90166,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Tegh Bahadur 4th Centenary Engineering College, G-8 Area, Rajouri Garden, New Delhi-110064",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 92046,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Computer Science & Technology",
    Quota: "HS",
    Closing_Rank: 92051,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE - AI",
    Quota: "HS",
    Closing_Rank: 92264,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Mechanical Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 92873,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "CS",
    Quota: "OS",
    Closing_Rank: 93122,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 94040,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "CSE- AIML",
    Quota: "OS",
    Closing_Rank: 94055,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "CSE- DS",
    Quota: "OS",
    Closing_Rank: 94731,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 96244,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Information Technology (Shift II)",
    Quota: "OS",
    Closing_Rank: 97208,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 98134,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "CSE- DS",
    Quota: "HS",
    Closing_Rank: 99433,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 99652,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Instrumentation & Control Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 99795,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 100008,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 100487,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 100672,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Machine Learning (Shift II)",
    Quota: "OS",
    Closing_Rank: 102470,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Data Science (Shift II)",
    Quota: "OS",
    Closing_Rank: 102526,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Chemical Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Chemical Engineering (Dual Degree)",
    Quota: "OS",
    Closing_Rank: 102791,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 102882,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Electronics & Communication Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 104381,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 106017,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Industrial Internet of Things",
    Quota: "OS",
    Closing_Rank: 106693,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "BM Institute of Engineering & Technology (Jain Minority Institute), Behind Fazilpur Power Station Sonepath, Bahalgarh Road, Village Raipur, Sonepat, Haryana",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 107281,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 108444,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 109630,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 110036,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "OS",
    Closing_Rank: 112357,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 112446,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "BM Institute of Engineering & Technology (Jain Minority Institute), Behind Fazilpur Power Station Sonepath, Bahalgarh Road, Village Raipur, Sonepat, Haryana",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 113022,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 113227,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Chemical Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Bio-chemical Engineering (Dual Degree)",
    Quota: "OS",
    Closing_Rank: 114268,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 114303,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Electronics & Communication Engineering",
    Quota: "OS",
    Closing_Rank: 114897,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Information Technology and Engineering",
    Quota: "HS",
    Closing_Rank: 115407,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Computer Science & Technology",
    Quota: "OS",
    Closing_Rank: 115604,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Electrical & Electronics Engineering",
    Quota: "OS",
    Closing_Rank: 116755,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 117436,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 117624,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Greater Noida Institute of Technology",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 118001,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Mechanical Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 118814,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 118889,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "CSE (Cyber Security)",
    Quota: "OS",
    Closing_Rank: 119020,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Information Technology (Shift I)",
    Quota: "OS",
    Closing_Rank: 119270,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Greater Noida Institute of Technology",
    Program: "Information Technology",
    Quota: "OS",
    Closing_Rank: 119598,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Civil Engineering (Shift I)",
    Quota: "OS",
    Closing_Rank: 120620,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 120677,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Artificial Intelligence & Data Science",
    Quota: "OS",
    Closing_Rank: 121668,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "OS",
    Closing_Rank: 122134,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Information Technology",
    Quota: "OS",
    Closing_Rank: 122147,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 122253,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Computer Science & Engineering",
    Quota: "OS",
    Closing_Rank: 122953,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Information Technology",
    Quota: "OS",
    Closing_Rank: 123072,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Computer Science & Technology",
    Quota: "OS",
    Closing_Rank: 123932,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Mechanical Engineering",
    Quota: "OS",
    Closing_Rank: 124683,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 125163,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Computer Science & Technology",
    Quota: "OS",
    Closing_Rank: 126236,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Electronics Engg.- VLSI Design & Technology",
    Quota: "OS",
    Closing_Rank: 126586,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Information Technology (Shift II)",
    Quota: "HS",
    Closing_Rank: 129489,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 133323,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 136135,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 138984,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 146895,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "CSE- DS",
    Quota: "HS",
    Closing_Rank: 147321,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 164661,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Information Technology",
    Quota: "HS",
    Closing_Rank: 165854,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 171701,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 173998,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics & Comm.- Advance Comm. Technology",
    Quota: "HS",
    Closing_Rank: 174542,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electronics & Communication Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 180104,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 183942,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 190025,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 195287,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "CSE- AIML",
    Quota: "HS",
    Closing_Rank: 196791,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Computer Science & Technology",
    Quota: "HS",
    Closing_Rank: 208061,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Automation & Robotics",
    Quota: "HS",
    Closing_Rank: 212959,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "CSE- DS",
    Quota: "HS",
    Closing_Rank: 214127,
  },
  {
    Institute_Type: "GOVT",
    Institute: "University School of Automation & Robotics",
    Program: "Industrial Internet of Things",
    Quota: "HS",
    Closing_Rank: 215066,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 216167,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electronics Engg.- VLSI Design & Technology",
    Quota: "HS",
    Closing_Rank: 217058,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 217768,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Information Technology (Shift II)",
    Quota: "HS",
    Closing_Rank: 226193,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 233079,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Electronics & Communication Engineering",
    Quota: "HS",
    Closing_Rank: 234250,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 234727,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 241777,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "CS",
    Quota: "HS",
    Closing_Rank: 245475,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Tegh Bahadur 4th Centenary Engineering College, G-8 Area, Rajouri Garden, New Delhi-110064",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 247586,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 252723,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Maharaja Surajmal Institute Technology",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 255554,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Information Technology (Shift II)",
    Quota: "HS",
    Closing_Rank: 261984,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 277751,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 281636,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Guru Teg Bahadur Institute of Technology, (Sikh Minority Institute)",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 288751,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Data Science (Shift II)",
    Quota: "HS",
    Closing_Rank: 294005,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Electronics & Communication Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 296958,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Mechanical Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 298293,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Artificial Intelligence & Machine Learning (Shift II)",
    Quota: "HS",
    Closing_Rank: 298637,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Industrial Internet of Things",
    Quota: "HS",
    Closing_Rank: 300345,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Electrical & Electronics Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 305045,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Bhagwan Parshuram Institute of Technology, P.S.P-4, Sector-17, Rohini, Delhi- 110085",
    Program: "Electrical & Electronics Engineering",
    Quota: "HS",
    Closing_Rank: 309030,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Maharaja Agrasen Institute of Technology, Sector-22, Rohini, Delhi – 110085",
    Program: "Mechanical & Automation Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 309290,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Electronics & Communication Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 315862,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Computer Science & Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 321000,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Chemical Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Chemical Engineering (Dual Degree)",
    Quota: "HS",
    Closing_Rank: 339192,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Computer Science & Engineering (Shift II)",
    Quota: "HS",
    Closing_Rank: 347735,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "CSE (Cyber Security)",
    Quota: "HS",
    Closing_Rank: 358179,
  },
  {
    Institute_Type: "GOVT",
    Institute:
      "University School of Chemical Technology, Sector 16 C, Dwarka, New Delhi - 110078",
    Program: "Bio-chemical Engineering (Dual Degree)",
    Quota: "HS",
    Closing_Rank: 360051,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Bharati Vidyapeeth's College of Engineering",
    Program: "Instrumentation & Control Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 360846,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Information Technology (Shift I)",
    Quota: "HS",
    Closing_Rank: 373569,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 375537,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Vivekanand Institute of Professional Studies - Technical Campus, AU Block,(Outer Ring Road), Pitampura, Delhi-110088",
    Program: "Electronics Engg.- VLSI Design & Technology",
    Quota: "HS",
    Closing_Rank: 383105,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 390850,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Mechanical Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 391163,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 391166,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "HMR Institute of Technology & Management",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 401205,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Dr. Akhilesh Das Gupta Institute of Technology & Management (Earlier name is Northern India Engineering College), FC-26, Shastri Park, New Delhi 110053",
    Program: "Civil Engineering (Shift I)",
    Quota: "HS",
    Closing_Rank: 401941,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "BM Institute of Engineering & Technology (Jain Minority Institute), Behind Fazilpur Power Station Sonepath, Bahalgarh Road, Village Raipur, Sonepat, Haryana",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 402226,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 408297,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "BM Institute of Engineering & Technology (Jain Minority Institute), Behind Fazilpur Power Station Sonepath, Bahalgarh Road, Village Raipur, Sonepat, Haryana",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 409323,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 416059,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 416832,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Greater Noida Institute of Technology",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 422121,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Delhi Technical Campus, 28/1, Knowledge Park, III, Greater NOIDA, UP",
    Program: "Computer Science & Technology",
    Quota: "HS",
    Closing_Rank: 429644,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Computer Science & Engineering",
    Quota: "HS",
    Closing_Rank: 431413,
  },
  {
    Institute_Type: "PRIVATE",
    Institute: "Greater Noida Institute of Technology",
    Program: "Information Technology",
    Quota: "HS",
    Closing_Rank: 432369,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Artificial Intelligence & Machine Learning",
    Quota: "HS",
    Closing_Rank: 432383,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Computer Science & Technology",
    Quota: "HS",
    Closing_Rank: 435829,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "JIMS Engineering Management Technical Campus, 48/4, Knowledge Park - III Greater Noida",
    Program: "Artificial Intelligence & Data Science",
    Quota: "HS",
    Closing_Rank: 436044,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Information Technology",
    Quota: "HS",
    Closing_Rank: 437148,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Trinity Institute of Innovations in Professional Studies, Plot no 2B/1, Knowledge Park - III, Greater Noida, Uttar Pradesh - 2011308",
    Program: "Computer Science & Technology",
    Quota: "HS",
    Closing_Rank: 438098,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Electrical & Electronics Engineering",
    Quota: "HS",
    Closing_Rank: 439485,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Electronics & Communication Engineering",
    Quota: "HS",
    Closing_Rank: 441060,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Information Technology",
    Quota: "HS",
    Closing_Rank: 441104,
  },
  {
    Institute_Type: "PRIVATE",
    Institute:
      "Shri Balwant Institute of Technology, Merrut Road (Pallri), Sonipat, NCR Delhi), Haryana (Jain Minority Institute)",
    Program: "Mechanical Engineering",
    Quota: "HS",
    Closing_Rank: 445564,
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


app.post("/ipu_choice_filling", async (req, res) => {
  const {
    FromWhereyouhavecompletedyou12thClass,
    email,
    CareerConnectMembers,
    DomicileState,
    Gender,
    Category,
    Jeepercentile,
    jeeMainsRank,
    Class12thPCMPercentage,
    Class12thAggregatePercentageofTop5Subjects,
    Recommendedcounseling,
    StudentName,
    ContactNumber,
    PaymentId,
    BITSATScore,
    OrderId,
    VITEEERank,
    SRMJEERank,
    ComedkRank,
    MITManipalRank,
    MHTCETPercentile,
  } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }


  // Determine the quota based on 12th class completion location
  const quota = FromWhereyouhavecompletedyou12thClass.toLowerCase() === "delhi" ? 'HS' : 'OS';

  // Filter based on quota and then sort by closing rank
  let filteredData = counselingIPUChoiceFillingData
    .filter(item => item.Quota === quota)
    .sort((a, b) => a.Closing_Rank - b.Closing_Rank);  // Sorting by closing rank in ascending order

  // Determine the number of programs to return
  const limit = Math.floor(Math.random() * 21) + 35; // Randomly between 35 and 55

  // If filtered list is shorter than the limit or contains no entries matching the rank condition, use the last entries
  if (filteredData.length < limit || !filteredData.some(item => jeeMainsRank <= item.Closing_Rank)) {
    filteredData = filteredData.slice(-limit); // Taking the last programs if the rank condition fails
  } else {
    // Otherwise, take the first 'limit' entries that closely match the rank
    filteredData = filteredData.filter(item => jeeMainsRank+25000 >= item.Closing_Rank).slice(0, limit);
  }

  const counselingDetails = filteredData
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.Institute_Type}</td>
        <td>${item.Institute}</td>
        <td>${item.Program}</td>
      </tr>
    `)
    .join("");

  const studentDetails = `
    <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px; border-color: #ddd;">
      <thead>
        <tr style="background-color: #0056b3; color: white;">
          <th>Attribute</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(req.body)
          .map(([key, value]) => `
          <tr style="background-color: #f9f9f9; color: #333;">
            <td>${key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</td>
            <td>${value}</td>
          </tr>
        `)
          .join("")}
      </tbody>
    </table>
  `;

  const htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #eef1f4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          h1, h2 {
            text-align: center;
            color: #0056b3;
          }
          table {
            width: 80%;
            margin: 20px auto;
            border-collapse: collapse;
            background-color: #fff;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #0056b3;
            color: #fff;
          }
          tr:hover {background-color: #f1f1f1;}
        </style>
      </head>
      <body>
        <h1>IPU Choice Filling Information</h1>
        <p>Here are the detailed student attributes and recommended programs based on the provided information:</p>
        ${studentDetails}
        <h2>Recommended Counseling Programs</h2>
        <table>
          <thead>
            <tr style="background-color: #0056b3; color: #fff;">
              <th>#</th>
              <th>Type</th>
              <th>Institute Name</th>
              <th>Program Name</th>
            </tr>
          </thead>
          <tbody>
            ${counselingDetails}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const transporter = nodemailer.createTransport(MAIL_SETTINGS);

  try {
    let info = await transporter.sendMail({
      from: `"Career Connect Services" <${MAIL_SETTINGS.auth.user}>`,
      to: email,
      bcc: CareerConnectMembers,
      subject: `IPU Choice Filling Information for ${StudentName}`,
      html: htmlContent,
    });

    logger.info("Email sent successfully: %s", info.messageId);
    res.json({ success: true, message: "Email has been sent successfully." });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});


app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || SERVER_PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
