let fs = require("fs");
//const moment = require("moment");
let moment = require("moment");
const path = require("path");
const DATE_FORMAT = "YYYY-MM-DD";
const validFileTypes = [
    "image/jpg",
    "image/jpeg",
    "image/png"
];

// Functions 
const moneyFormat = (amount, locale = "en-US") => {
  //return new Intl.NumberFormat(locale).format(amount);
  return new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ILS'
}).format(amount);

};

/** Date functions **/
const isExpired = (dueDate) => {
  let todayDate = moment();
  return todayDate.isAfter(dueDate);
};

const daysToExpire = (dueDate) => {
  let todayDate = moment();
  let expiryDate = moment(dueDate, DATE_FORMAT);

  if (expiryDate.isBefore(todayDate, "day")) {
    return 0;
  }

  return expiryDate.diff(todayDate, "days");
};

/** Inventory **/
/**
 * Determines the stock status based on current stock and minimum stock levels.
 *
 * @param {number} currentStock - The current quantity of stock.
 * @param {number} minimumStock - The minimum required quantity of stock.
 * @returns {number} - Returns 0 if there is no stock, -1 if the stock is low, and 1 if the stock level is normal.
 */
const getStockStatus = (currentStock, minimumStock)=>{
  currentStock = Number(currentStock);
  minimumStock = Number(minimumStock);
   if (isNaN(currentStock) || isNaN(minimumStock)) {
    throw new Error("Invalid input: both currentStock and minimumStock should be numbers.");
  }

  if (currentStock <= 0) {
    return 0; // No stock
  }

  if (currentStock <= minimumStock) {
    return -1; // Low stock
  }
  return 1; // Normal stock
}

const extractCategories = (text) => {
  const rows = text.split(/\r?\n/).filter(r => r.trim().length);
  if (rows.length === 0) return [];

  const header = rows[0].split(",").map(h => h.trim().toLowerCase());
  const colIndex = header.indexOf("category");
  if (colIndex === -1) return [];

  return rows.slice(1)
    .map(r => {
      const value = r.split(",")[colIndex];
      return value ? value.trim().toLowerCase() : "";
    })
    .filter(v => v !== "");
};

const extractUniqueCategories = (csvFile) => {
  const all = extractCategories(csvFile);
  return Array.from(new Set(all));
};

/** File **/
const checkFileExists = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile(); 
  } catch (err) {
    return false;
  }
};

const checkFileType = (fileType, validFileTypes) => {
  return validFileTypes.includes(fileType);
};

const getFileHash = (filePath) => {
  const crypto = require("crypto");
  const fileData = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(fileData).digest("hex");
  return hash;
};

const filterFile = (req, file, callback) => {
    try {
      const isValidFile = checkFileType(file.mimetype, validFileTypes);
      if (isValidFile) {
        return callback(null, true);
      } else {
        return callback(new Error(`Invalid file type. Only JPEG, PNG, GIF, and WEBP files are allowed.`), false);
      }
    } catch (err) {
      return callback(new Error(`An error occurred: ${err}`),false);
    }
};

/*Security*/
// Build a connect-src whitelist that matches the current app mode.
// Terminal: allow the configured Server's LAN endpoint. Server/Standalone:
// only 'self' (the embedded API on localhost) is needed.
const buildConnectSrc = () => {
  const sources = ["'self'"];
  try {
    const Store = require("electron-store");
    const stored = /** @type {any} */ (new Store().get("settings")) || {};
    if (stored.app === "Network Point of Sale Terminal" && stored.ip && stored.port) {
      sources.push(`http://${stored.ip}:${stored.port}`);
    }
    // Allow plain http: so the Test Connection probe can reach any LAN
    // candidate before the IP is saved. The license-key gate on the Server
    // side remains the real authentication boundary.
    sources.push("http:");
  } catch (e) {
    // electron-store unavailable — fall back to self-only.
  }
  return sources.join(" ");
};

const setContentSecurityPolicy = () => {
  let scriptHash = getFileHash(path.join(__dirname,"../dist","js","bundle.min.js"))
  let styleHash = getFileHash(path.join(__dirname,"../dist","css","bundle.min.css"));
  const connectSrc = buildConnectSrc();
  let content = `default-src 'self'; img-src 'self' data:;script-src 'self' 'unsafe-eval' 'unsafe-inline' sha256-${scriptHash}; style-src 'self' 'unsafe-inline' sha256-${styleHash};font-src 'self';base-uri 'self'; form-action 'self'; connect-src ${connectSrc}`;
  let metaTag = document.createElement("meta");
  metaTag.setAttribute("http-equiv", "Content-Security-Policy");
  metaTag.setAttribute("content", content);
  document.head.appendChild(metaTag);
};


const playNotificationSound = () => {
  const audio = new Audio('./notification.mp3'); 
  audio.play().catch(err => console.error(err));
};

const decodeHtmlEntities = (str) => {
    return str.replace(/&#x2F;/g, '/')
               .replace(/&#39;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>');
}

module.exports = {
  DATE_FORMAT,
  moneyFormat,
  isExpired,
  getStockStatus,
  getFileHash,
  daysToExpire,
  checkFileExists,
  checkFileType,
  setContentSecurityPolicy,
  extractUniqueCategories,
  playNotificationSound,
  filterFile,
  decodeHtmlEntities
};

