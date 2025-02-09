"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rdsDb = exports.createDatabaseIfNotExists = void 0;
var pg_1 = __importDefault(require("pg"));
var Pool = pg_1.default.Pool;
var node_postgres_1 = require("drizzle-orm/node-postgres");
if (!process.env.AWS_RDS_URL) {
    throw new Error("AWS_RDS_URL must be set for supplement reference database");
}
var ensureCorrectProtocol = function (url) {
    if (url.startsWith('postgresql://')) {
        return url.replace('postgresql://', 'postgres://');
    }
    if (!url.startsWith('postgres://')) {
        return "postgres://".concat(url);
    }
    return url;
};
// Remove database name from URL for initial connection
var getRootUrl = function (url) {
    var match = url.match(/(postgres:\/\/[^:]+:[^@]+@[^:]+:\d+)\/.*/);
    return match ? match[1] + '/postgres' : url; // Connect to 'postgres' database initially
};
var rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);
var rootUrl = getRootUrl(rdsUrl);
console.log('Attempting to connect to RDS with URL pattern:', rdsUrl.replace(/:[^:@]+@/, ':****@'));
// Enhanced pool configuration with aggressive timeouts and retry strategy
var poolConfig = {
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'no-verify',
        ssl: true,
        sslConnectTimeout: 10000
    },
    connectionTimeoutMillis: 300000, // 5 minutes
    idleTimeoutMillis: 300000,
    max: 1, // Single connection to avoid overhead
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    statement_timeout: 120000, // 2 minutes
    query_timeout: 120000,
    application_name: 'supplement-tracker',
    retry_strategy: {
        retries: 5,
        factor: 1.5,
        minTimeout: 2000,
        maxTimeout: 120000
    },
    // Network-level timeouts
    tcp_keepalive: true,
    tcp_keepalive_time: 60,
    tcp_keepalive_interval: 30,
    tcp_keepalive_count: 5
};
// Construct a connection string with explicit parameters
var getConnectionString = function (url) {
    var parsed = new URL(url);
    return "postgres://".concat(parsed.username, ":").concat(parsed.password, "@").concat(parsed.hostname, ":").concat(parsed.port).concat(parsed.pathname, "?sslmode=no-verify&ssl=true&connect_timeout=300&application_name=supplement-tracker&keepalives=1&keepalives_idle=60&keepalives_interval=30&keepalives_count=5");
};
// First create a pool for root connection (no database specified)
var rootPool = new Pool(__assign({ connectionString: getConnectionString(rootUrl) }, poolConfig));
// Create the database if it doesn't exist
var createDatabaseIfNotExists = function () { return __awaiter(void 0, void 0, void 0, function () {
    var client, dbName, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, rootPool.connect()];
            case 1:
                client = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 7, 8, 9]);
                dbName = (_a = rdsUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0];
                if (!dbName)
                    throw new Error('Could not extract database name from URL');
                console.log('Checking if database exists:', dbName);
                return [4 /*yield*/, client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName])];
            case 3:
                result = _b.sent();
                if (!(result.rows.length === 0)) return [3 /*break*/, 5];
                console.log("Creating database ".concat(dbName, "..."));
                return [4 /*yield*/, client.query("CREATE DATABASE \"".concat(dbName, "\""))];
            case 4:
                _b.sent();
                console.log('Database created successfully');
                return [3 /*break*/, 6];
            case 5:
                console.log('Database already exists');
                _b.label = 6;
            case 6: return [3 /*break*/, 9];
            case 7:
                error_1 = _b.sent();
                console.error('Error in createDatabaseIfNotExists:', {
                    message: error_1 instanceof Error ? error_1.message : String(error_1),
                    timestamp: new Date().toISOString(),
                    stack: error_1 instanceof Error ? error_1.stack : undefined
                });
                throw error_1;
            case 8:
                client.release();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.createDatabaseIfNotExists = createDatabaseIfNotExists;
// Pool for actual application connection (with database)
var pool = new Pool(__assign({ connectionString: getConnectionString(rdsUrl) }, poolConfig));
// Enhanced connection event logging
pool.on('connect', function (client) {
    console.log('New client connected to PostgreSQL:', {
        timestamp: new Date().toISOString(),
        database: pool.options.database,
        host: pool.options.host,
        port: pool.options.port,
        user: pool.options.user,
        application_name: pool.options.application_name
    });
});
pool.on('error', function (err) {
    console.error('Unexpected PostgreSQL error:', {
        message: err instanceof Error ? err.message : String(err),
        code: err instanceof Error && 'code' in err ? err.code : undefined,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
    });
});
pool.on('acquire', function () {
    console.log('Client acquired from pool');
});
pool.on('remove', function () {
    console.log('Client removed from pool');
});
exports.rdsDb = (0, node_postgres_1.drizzle)(pool);
