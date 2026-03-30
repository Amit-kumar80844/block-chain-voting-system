const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, ".env")
});

const app = require("./app");
const connectDB = require("./config/db");
const Election = require("./models/Election");
const blockchainService = require("./services/blockchainService");

const PORT = process.env.PORT || 5000;

const bootstrapServer = async () => {
  try {
    await connectDB();

    const electionConfig = await Election.findOne();

    if (!electionConfig) {
      await Election.create({
        isElectionActive: false
      });
      console.log("Election configuration initialized.");
    }

    await blockchainService.initializeChain();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

bootstrapServer();
