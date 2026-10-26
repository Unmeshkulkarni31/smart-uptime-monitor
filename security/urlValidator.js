const ipaddr = require("ipaddr.js");
const dns = require("node:dns/promises");

// Validate the URL's format and basic properties.
function validateUrl(url) {
    if (typeof url !== "string" || url.trim() === "") {
        throw new Error("A URL is required.");
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error("Invalid URL.");
    }

    if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
    ) {
        throw new Error("Only HTTP and HTTPS URLs are allowed.");
    }

    if (parsedUrl.username || parsedUrl.password) {
        throw new Error("URLs containing credentials are not allowed.");
    }

    const hostname = parsedUrl.hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "");

    if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local")
    ) {
        throw new Error("Local hostnames are not allowed.");
    }

    if (ipaddr.isValid(hostname)) {
        if (!isPublicIp(hostname)) {
            throw new Error("Non-public IP addresses are not allowed.");
        }
    }

    return parsedUrl;
}

// Check whether an IP address is globally routable.
function isPublicIp(ip) {
    if (!ipaddr.isValid(ip)) {
        return false;
    }

    let address = ipaddr.parse(ip);

    // Handle IPv4 addresses represented as IPv6 addresses.
    if (
        address.kind() === "ipv6" &&
        address.isIPv4MappedAddress()
    ) {
        address = address.toIPv4Address();
    }

    return address.range() === "unicast";
}

// Validate the URL and inspect all DNS addresses.
async function validatePublicDestination(url) {
    const parsedUrl = validateUrl(url);

    const hostname = parsedUrl.hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "");

    // IP addresses don't require DNS resolution.
    if (ipaddr.isValid(hostname)) {
        if (!isPublicIp(hostname)) {
            throw new Error("Non-public IP addresses are not allowed.");
        }

        return parsedUrl;
    }

    let addresses;

    try {
        addresses = await dns.lookup(hostname, {
            all: true,
            verbatim: true
        });
    } catch {
        throw new Error("The hostname could not be resolved.");
    }

    if (addresses.length === 0) {
        throw new Error("The hostname has no resolved IP addresses.");
    }

    for (const record of addresses) {
        if (!isPublicIp(record.address)) {
            throw new Error(
                "The hostname resolves to a non-public IP address."
            );
        }
    }

    return parsedUrl;
}

module.exports = {
    validateUrl,
    validatePublicDestination,
    isPublicIp
};