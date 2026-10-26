const {
    validatePublicDestination
} = require("./security/urlValidator");

const testUrls = [
    "https://example.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.1",
    "ftp://example.com",
    "not-a-url"
];

async function runTests() {
    for (const url of testUrls) {
        try {
            const parsedUrl =
                await validatePublicDestination(url);

            console.log("ALLOWED:", parsedUrl.toString());

        } catch (error) {
            console.log(
                "BLOCKED:",
                url,
                "-",
                error.message
            );
        }
    }
}

runTests();