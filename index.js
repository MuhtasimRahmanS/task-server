// Importing required modules
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware Setup
app.use(
  cors({
    origin: ["http://localhost:5173", "https://jobtaskscic.netlify.app"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

// MongoDB connection string and client setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qov5o8j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Function to start the server and handle database operations
async function run() {
  try {
    // MongoDB collection reference
    const productCollection = client.db("task").collection("allProduct");

    // API endpoint: Get products with pagination, filtering, sorting, and searching
    app.get("/products", async (req, res) => {
      const size = parseInt(req.query.size) || 12; // Default size if not provided
      const page = parseInt(req.query.page) - 1 || 0; // Default page to 0 if not provided
      const filter = req.query.filter || ""; // Filter by category
      const sort = req.query.sort || ""; // Sorting order
      const search = req.query.search || ""; // Search by product name

      console.log(`Size: ${size}, Page: ${page}`);

      // Query and options for filtering, sorting, and searching
      let query = {
        ProductName: { $regex: search, $options: "i" }, // Case-insensitive search
      };
      if (filter) query.Category = filter;

      let options = {};
      if (sort) {
        options.sort = {
          Price: sort === "asc" ? 1 : -1, // Sort by price in ascending or descending order
        };
      }

      // Fetching products with pagination
      const result = await productCollection
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray();

      res.send(result);
    });

    // API endpoint: Get product count for pagination
    app.get("/product-count", async (req, res) => {
      const filter = req.query.filter || "";
      const search = req.query.search || "";

      // Query for filtering and searching
      let query = {
        ProductName: { $regex: search, $options: "i" },
      };
      if (filter) query.Category = filter;

      // Get the count of documents matching the query
      const count = await productCollection.countDocuments(query);

      res.send({ count });
    });

    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Do not close the connection as it would stop the server
    // await client.close();
  }
}

// Run the server and establish MongoDB connection
run().catch(console.dir);

// Root API route to check server status
app.get("/", (req, res) => {
  res.send("Server running successfully");
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
