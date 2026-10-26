const { checkWebsite } = require("./checker");

async function runTests() {
    const testUrls = [
        "https://example.com",
        "http://127.0.0.1:3000",
        "http://192.168.1.1"
    ];

    for (const url of testUrls) {
        console.log("\nChecking:", url);

        try {
            const result = await checkWebsite(url);

            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.log("BLOCKED OR FAILED:", error.message);
        }
    }
}

runTests();