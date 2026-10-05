// True only for a 24-character hex string (a real MongoDB ObjectId).
module.exports = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
