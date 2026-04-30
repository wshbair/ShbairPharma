/**
 * Shared NeDB datastore singletons.
 *
 * Every API module that needs database access must import from here
 * so that each .db file is opened by exactly ONE Datastore instance.
 * Opening the same file in multiple Datastore instances causes a race
 * condition on NeDB's crash-safe rename (db~ → db) which produces:
 *   ENOENT: no such file or directory, rename '...db~' → '...db'
 */

const Datastore = /** @type {typeof import("@seald-io/nedb").default} */ (/** @type {unknown} */ (require("@seald-io/nedb")));
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
const customersDB  = new Datastore({ filename: dbFile("customers.db"),     autoload: true });
const transactionsDB  = new Datastore({ filename: dbFile("transactions.db"),     autoload: true });
const usersDB  = new Datastore({ filename: dbFile("users.db"),     autoload: true });
const providersDB  = new Datastore({ filename: dbFile("providers.db"),     autoload: true });


inventoryDB.ensureIndex({ fieldName: "_id", unique: true });
invoicesDB.ensureIndex({  fieldName: "_id", unique: true });
paymentsDB.ensureIndex({  fieldName: "_id", unique: true });
categoriesDB.ensureIndex({  fieldName: "name", unique: true });
customersDB.ensureIndex({  fieldName: "_id", unique: true });
transactionsDB.ensureIndex({  fieldName: "_id", unique: true });
usersDB.ensureIndex({  fieldName: "_id", unique: true });
providersDB.ensureIndex({  fieldName: "_id", unique: true });

module.exports = { 
    inventoryDB, 
    invoicesDB, 
    paymentsDB, 
    categoriesDB, 
    customersDB, 
    transactionsDB, 
    usersDB, 
    providersDB 
};
