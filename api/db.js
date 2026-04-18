/**
 * Shared NeDB datastore singletons.
 *
 * Every API module that needs database access must import from here
 * so that each .db file is opened by exactly ONE Datastore instance.
 * Opening the same file in multiple Datastore instances causes a race
 * condition on NeDB's crash-safe rename (db~ → db) which produces:
 *   ENOENT: no such file or directory, rename '...db~' → '...db'
 */

const Datastore = require("@seald-io/nedb");
const path = require("path");

const appName = process.env.APPNAME;
const appData = process.env.APPDATA;

function dbFile(name) {
    return path.join(appData, appName, "server", "databases", name);
}

const inventoryDB = new Datastore({ filename: dbFile("inventory.db"),    autoload: true });
const invoicesDB  = new Datastore({ filename: dbFile("invoices.db"),     autoload: true });
const paymentsDB  = new Datastore({ filename: dbFile("payments.db"),     autoload: true });
const categoriesDB  = new Datastore({ filename: dbFile("categories.db"),     autoload: true });


inventoryDB.ensureIndex({ fieldName: "_id", unique: true });
invoicesDB.ensureIndex({  fieldName: "_id", unique: true });
paymentsDB.ensureIndex({  fieldName: "_id", unique: true });
categoriesDB.ensureIndex({  fieldName: "_id", unique: true });

module.exports = { inventoryDB, invoicesDB, paymentsDB, categoriesDB };
