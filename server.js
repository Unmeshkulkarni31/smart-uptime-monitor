const express = require("express");
const { checkWebsite } = require("./checker");

const app = express();
const PORT = 3000;

// Route 1: Home page
app.get("/", (req, res) => {
    res.send("My first backend server is working!");
});

// Route 2: About page
app.get("/about", (req, res) => {
    res.send("This is my Smart Uptime Monitoring project.");
});

// Route 3: Check a website securely
app.get("/api/check", async (req, res) => {

    // Step 1: Get the URL from the request
    const url = req.query.url;

    // Step 2: Check whether the user provided a URL
    if (typeof url !== "string" || !url.trim()) {
        return res.status(400).json({
            error: "Please provide a URL."
        });
    }

    try {
        // Step 3: Use our checker with SSRF protections
        const result = await checkWebsite(url);

        // Step 4: Return the monitoring result
        return res.status(200).json(result);

    } catch (error) {
        // Step 5: Handle invalid URLs and blocked destinations
        const clientErrors = new Set([
            "Invalid URL.",
            "Only HTTP and HTTPS URLs are allowed.",
            "URL username and password are not allowed.",
            "Local hostnames are not allowed.",
            "Non-public IP addresses are not allowed."
        ]);

        if (clientErrors.has(error.message)) {
            return res.status(400).json({
                error: error.message
            });
        }

        // Other failures may be DNS errors, timeouts,
        // connection errors, or other network problems.
        return res.status(502).json({
            error: "Unable to check the website.",
            details: error.code || error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});