require('dotenv').config()
const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For secure OTP generation
const { saveOtp, verifyOtp } = require('./otpStorage');
const mongoose = require('mongoose');
const User = require('./models/Users');
const port = process.env.PORT || 3001;
const { ethers } = require("ethers");
const abi = require("./faucet_abi.json")
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_DB_ATLAS_CLUSTER_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((error) => console.error('MongoDB connection failed:', error));



app.use(bodyParser.json());
app.use(express.json());
app.use(cors())
const rateLimit = require('express-rate-limit');

// Define rate limit: max 5 requests per 15 minutes per IP
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many OTP requests from this IP, please try again after 15 minutes.',
});

// Apply rate limiter to the /request-otp route
//app.post('/request-otp', otpRequestLimiter, /* existing middleware and handler */);

app.get("/", (req, res) => {
  console.log("received request on /", req.body)
  res.type('html').send(html)
});



// Create transporter with Namecheap SMTP settings
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com', // Namecheap SMTP server
  port: 465, // Port for TLS
  secure: true, // Use false for TLS, true for SSL (465)
  auth: {
    user: process.env.EMAIL_ID, // Your Namecheap email
    pass: process.env.PASSWORD, // Your email password
  },
  debug: true, // Enable debug output
  logger: true, // Log information to console
});

// Generate a 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: '"Sahaai" support@sahaaai.com',
    to: email,
    subject: 'Your OTP for Verification',
    text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
  console.log('OTP email sent successfully!');
}
const { body, validationResult } = require('express-validator');

// Middleware to check validation results
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}


//Request Faucet

async function claimFaucet(userAdd) {
  try {
    // Connect to the Ethereum provider
    providerUrl = process.env.RPC_URL
    privateKey = process.env.WALLET_PRIVATE_KEY;
    contractAddress = process.env.CONTRACT_ADDRESS;
    const provider = new ethers.JsonRpcProvider(providerUrl);

    // Create a wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);


    // Connect to the faucet contract
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    console.log(abi)
    // Call the claim function
    const tx = await contract.claim(ethers.getAddress(userAdd));
    console.log(`Transaction sent: ${tx.hash}`);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
  } catch (error) {
    console.error("Error claiming faucet:", error);
  }
}


// Request OTP with validation
app.post(
  '/request-otp',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('walletAddress').matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  async (req, res) => {
    const { name, email, walletAddress } = req.body;
    console.log("received request on /request-otp", req.body)

    const otp = generateOtp();
    saveOtp(email, otp);

    try {
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({ name, email, walletAddress });
        await user.save();
      } else {
        res.status(400).json({ message: "user already registered" })
      }

      await sendOtpEmail(email, otp);
      res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Verify OTP with validation
app.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('otp').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
  ],
  validateRequest,
  async (req, res) => {
    console.log("received request on /verify-otp", req.body)
    const { email, otp, userAdd } = req.body;
    const verificationResult = verifyOtp(email, otp);
    if (verificationResult === 'blocked') {
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (verificationResult) {
      try {
        await User.findOneAndUpdate({ email }, { isVerified: true });
        await claimFaucet(userAdd);
        res.status(200).json({ message: 'Email verified successfully!' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify email' });
      }
    } else {
      res.status(400).json({ error: 'Invalid or expired OTP' });
    }
  }
);

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Sahaaai!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from Sahaaai!
    </section>
  </body>
</html>
`
