// Each successful login gets its own unique token. Keying sessions by a
// single shared token let one role's login overwrite another's — a
// product_manager and a sales_manager would collide. Unique tokens fix that.
const adminSessions = {};

module.exports = adminSessions;
