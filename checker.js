const http = require("node:http");
const https = require("node:https");
const dns = require("node:dns/promises");

const {
    validateUrl,
    isPublicIp
} = require("./security/urlValidator");

// Resolve the hostname and validate the addresses
// at the time the HTTP connection is made.
function safeLookup(hostname, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    dns.lookup(hostname, {
        all: true,
        verbatim: true
    })
        .then((addresses) => {
            if (addresses.length === 0) {
                throw new Error("No IP addresses found.");
            }

            // Reject the destination if ANY address is unsafe.
            for (const record of addresses) {
                if (!isPublicIp(record.address)) {
                    throw new Error(
                        "Hostname resolves to a non-public IP."
                    );
                }
            }

            // Respect a requested address family, if provided.
            const family = options.family || 0;

            const candidates = family
                ? addresses.filter(
                    (record) => record.family === family
                )
                : addresses;

            if (candidates.length === 0) {
                throw new Error(
                    "No addresses match the requested IP family."
                );
            }

            // Return only addresses that passed validation.
            if (options.all) {
                callback(null, candidates);
            } else {
                callback(
                    null,
                    candidates[0].address,
                    candidates[0].family
                );
            }
        })
        .catch((error) => {
            callback(error);
        });
}

// Check a website using a validated connection.
function checkWebsite(url) {
    // Validate the URL before attempting a connection.
    const parsedUrl = validateUrl(url);

    const client = parsedUrl.protocol === "https:"
        ? https
        : http;

    const startTime = Date.now();
    const timeoutMs = 5000;

    return new Promise((resolve, reject) => {
        const request = client.request(
            parsedUrl,
            {
                method: "GET",

                // Use our controlled DNS lookup.
                lookup: safeLookup,

                // Disable automatic connection pooling for this
                // learning implementation.
                agent: false,

                // Limit the size of response headers.
                maxHeaderSize: 16 * 1024,

                headers: {
                    "User-Agent": "SmartUptimeMonitor/1.0"
                }
            },
            (response) => {
                const responseTimeMs = Date.now() - startTime;

                const result = {
                    url: parsedUrl.toString(),
                    statusCode: response.statusCode,
                    responseTimeMs,
                    isUp:
                        response.statusCode >= 200 &&
                        response.statusCode < 400,
                    checkedAt: new Date().toISOString()
                };

                // Do not follow redirects automatically.
                // Consume the response so its stream can close.
                response.resume();

                resolve(result);
            }
        );

        // Enforce an overall timeout for this request.
        const timer = setTimeout(() => {
            const error = new Error("Request timed out.");
            error.code = "ETIMEDOUT";
            request.destroy(error);
        }, timeoutMs);

        request.on("error", (error) => {
            clearTimeout(timer);
            reject(error);
        });

        request.on("response", () => {
            clearTimeout(timer);
        });

        request.on("close", () => {
            clearTimeout(timer);
        });

        request.end();
    });
}

module.exports = { checkWebsite };