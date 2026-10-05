const http = require("http");

const options = {
    hostname: "localhost",
    port: 5000,
    path: "/",
    method: "GET"
};

const req = http.request(options, (res) => {

    console.log("Server responded with status:", res.statusCode);

    if (res.statusCode >= 200 && res.statusCode < 500) {
        console.log("TEST PASSED - FoundAI backend is reachable.");
        process.exit(0);
    } else {
        console.log("TEST FAILED - Unexpected server status.");
        process.exit(1);
    }
});

req.on("error", (error) => {
    console.log("TEST FAILED - Could not connect to FoundAI backend.");
    console.log(error.message);
    process.exit(1);
});

req.end();