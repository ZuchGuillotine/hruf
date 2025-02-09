"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var rds_1 = require("./rds");
var schema_1 = require("./schema");
var drizzle_orm_1 = require("drizzle-orm");
var dns_1 = __importDefault(require("dns"));
var util_1 = require("util");
var net_1 = __importDefault(require("net"));
var lookup = (0, util_1.promisify)(dns_1.default.lookup);
function testTcpConnection(host, port) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var socket = new net_1.default.Socket();
                    var connected = false;
                    socket.setTimeout(5000); // 5 second timeout
                    socket.on('connect', function () {
                        connected = true;
                        socket.end();
                        resolve({ success: true });
                    });
                    socket.on('timeout', function () {
                        socket.destroy();
                        resolve({ success: false, error: 'Connection attempt timed out' });
                    });
                    socket.on('error', function (err) {
                        socket.destroy();
                        resolve({
                            success: false,
                            error: err instanceof Error ? err.message : 'Unknown connection error'
                        });
                    });
                    socket.connect(port, host);
                })];
        });
    });
}
function verifyRdsTable() {
    return __awaiter(this, void 0, void 0, function () {
        var rdsUrl, hostname, port, dnsResult, attempts, maxAttempts, lastError, _a, success, error, dnsError_1, result, supplements, error_1, rdsUrl, urlParts;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('Starting RDS verification...');
                    console.log('Replit IP Address: 34.148.196.141');
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 15, , 16]);
                    rdsUrl = process.env.AWS_RDS_URL || '';
                    hostname = (_b = rdsUrl.match(/@([^:]+):/)) === null || _b === void 0 ? void 0 : _b[1];
                    port = parseInt(((_c = rdsUrl.match(/:(\d+)\//)) === null || _c === void 0 ? void 0 : _c[1]) || '5432');
                    if (!hostname) return [3 /*break*/, 11];
                    console.log('Performing DNS lookup for RDS hostname...');
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 10, , 11]);
                    return [4 /*yield*/, lookup(hostname)];
                case 3:
                    dnsResult = _f.sent();
                    console.log('DNS Resolution successful:', {
                        hostname: hostname,
                        ip: dnsResult.address,
                        family: dnsResult.family
                    });
                    // Test raw TCP connection with retries
                    console.log('Testing raw TCP connection...');
                    attempts = 0;
                    maxAttempts = 3;
                    lastError = '';
                    _f.label = 4;
                case 4:
                    if (!(attempts < maxAttempts)) return [3 /*break*/, 9];
                    attempts++;
                    console.log("TCP connection attempt ".concat(attempts, "/").concat(maxAttempts, "..."));
                    return [4 /*yield*/, testTcpConnection(dnsResult.address, port)];
                case 5:
                    _a = _f.sent(), success = _a.success, error = _a.error;
                    if (!success) return [3 /*break*/, 6];
                    console.log('TCP connection successful - port is reachable');
                    return [3 /*break*/, 9];
                case 6:
                    lastError = error || 'Unknown error';
                    console.log("TCP connection attempt ".concat(attempts, " failed:"), error);
                    if (!(attempts < maxAttempts)) return [3 /*break*/, 8];
                    console.log('Waiting 2 seconds before retry...');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 7:
                    _f.sent();
                    _f.label = 8;
                case 8: return [3 /*break*/, 4];
                case 9:
                    if (attempts === maxAttempts) {
                        console.log('All TCP connection attempts failed. Last error:', lastError);
                        console.log('This suggests a network connectivity issue:');
                        console.log('1. Security group may be blocking access');
                        console.log('2. Network ACL may be restricting traffic');
                        console.log('3. Route table may not be properly configured');
                        // Additional network path diagnostics
                        console.log('\nNetwork Path Analysis:');
                        console.log('1. Source: Replit (34.148.196.141) in us-east-1');
                        console.log('2. Destination:', dnsResult.address, 'in us-east-2');
                        console.log('3. Required Network Path:');
                        console.log('   - Traffic leaves Replit in us-east-1');
                        console.log('   - Crosses to AWS us-east-2 region');
                        console.log('   - Enters VPC:', process.env.AWS_VPC_ID || 'vpc-0828d71205e8b01f9');
                        console.log('   - Through Internet Gateway:', process.env.AWS_IGW_ID || 'igw-0f7c57458c5d92051');
                        console.log('   - Passes Network ACL:', 'acl-023b9eedcd59a8791');
                        console.log('   - Reaches RDS Security Group');
                        console.log('\nPotential Blocking Points:');
                        console.log('1. Network ACL inbound rule missing for port 5432');
                        console.log('2. Network ACL outbound rule missing for ephemeral ports');
                        console.log('3. Security Group inbound rule misconfigured');
                        console.log('4. Route table missing Internet Gateway route');
                        console.log('\nSubnet Route Table Verification:');
                        console.log('Route Table ID: rtb-05a0ba83c3045fb71');
                        console.log('Required route: 0.0.0.0/0 -> igw-0f7c57458c5d92051');
                        console.log('Subnet associations to verify:');
                        console.log('- subnet-0724c47e95b57f9a2 (us-east-2c)');
                        console.log('- subnet-035cb767062c7f44f (us-east-2a)');
                        console.log('- subnet-0262500bb81bef74e (us-east-2b)');
                    }
                    return [3 /*break*/, 11];
                case 10:
                    dnsError_1 = _f.sent();
                    console.error('DNS Resolution failed:', {
                        hostname: hostname,
                        error: dnsError_1 instanceof Error ? dnsError_1.message : String(dnsError_1)
                    });
                    return [3 /*break*/, 11];
                case 11:
                    // Database connection test
                    console.log('Testing database connection with increased timeout...');
                    // First ensure database exists
                    return [4 /*yield*/, (0, rds_1.createDatabaseIfNotExists)()];
                case 12:
                    // First ensure database exists
                    _f.sent();
                    // Basic connection test
                    console.log('Attempting basic connection test...');
                    return [4 /*yield*/, rds_1.rdsDb.execute((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT NOW()"], ["SELECT NOW()"]))))];
                case 13:
                    result = _f.sent();
                    console.log('Basic connection test successful, server time:', (_d = result[0]) === null || _d === void 0 ? void 0 : _d.now);
                    // Test table access
                    console.log('Attempting to query supplement reference table...');
                    return [4 /*yield*/, rds_1.rdsDb.select().from(schema_1.supplementReference)];
                case 14:
                    supplements = _f.sent();
                    console.log("Successfully connected to RDS! Found ".concat(supplements.length, " supplements"));
                    return [3 /*break*/, 16];
                case 15:
                    error_1 = _f.sent();
                    console.error("Error connecting to RDS:", {
                        message: error_1.message,
                        code: error_1.code,
                        errno: error_1.errno,
                        address: error_1.address,
                        port: error_1.port,
                        stack: error_1.stack,
                        timestamp: new Date().toISOString()
                    });
                    rdsUrl = process.env.AWS_RDS_URL || '';
                    urlParts = {
                        hasProtocol: rdsUrl.startsWith('postgres://') || rdsUrl.startsWith('postgresql://'),
                        containsHost: rdsUrl.includes('@'),
                        containsPort: /:\d+\//.test(rdsUrl),
                        containsDatabase: /\/[^/]+$/.test(rdsUrl),
                        region: ((_e = rdsUrl.match(/\.([^.]+)\.rds\.amazonaws\.com/)) === null || _e === void 0 ? void 0 : _e[1]) || 'unknown'
                    };
                    console.log('Connection Diagnostics:', {
                        urlFormat: urlParts,
                        region: urlParts.region,
                        replitRegion: 'us-east-1', // Replit's primary region
                        possibleIssues: [
                            urlParts.region !== 'us-east-1'
                                ? 'RDS instance is in a different region than Replit (us-east-1)'
                                : 'RDS and Replit are in the same region',
                            'Security group may need to allow inbound from 34.148.196.141',
                            'VPC configuration might be blocking access',
                            'Database instance status should be checked in AWS Console',
                            'Network ACL (acl-023b9eedcd59a8791) may be blocking PostgreSQL traffic'
                        ],
                        recommendations: [
                            '1. Verify RDS security group allows inbound from 34.148.196.141 on port 5432',
                            '2. Check if RDS instance is publicly accessible',
                            '3. Ensure database instance is in "available" state',
                            '4. Verify Network ACL allows inbound traffic on port 5432',
                            '5. Consider creating RDS instance in us-east-1 region for better latency'
                        ]
                    });
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
verifyRdsTable()
    .catch(console.error)
    .finally(function () { return process.exit(); });
var templateObject_1;
