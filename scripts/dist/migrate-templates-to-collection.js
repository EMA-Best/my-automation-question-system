"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
require("reflect-metadata");
var mongoose_1 = require("mongoose");
function normalizeComponentList(list) {
    var source = Array.isArray(list) ? list : [];
    return source
        .filter(function (c) { return c && typeof c.type === 'string' && typeof c.title === 'string'; })
        .map(function (c) {
        var _a, _b;
        return ({
            fe_id: c.fe_id || new mongoose_1["default"].Types.ObjectId().toString(),
            type: c.type,
            title: c.title,
            isHidden: (_a = c.isHidden) !== null && _a !== void 0 ? _a : false,
            isLocked: (_b = c.isLocked) !== null && _b !== void 0 ? _b : false,
            props: typeof c.props === 'object' && c.props != null
                ? c.props
                : {}
        });
    });
}
function main() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var host, port, database, uri, db, questions, templates, legacyTemplates, ops, result;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    host = (_a = process.env.MONGO_HOST) !== null && _a !== void 0 ? _a : 'localhost';
                    port = (_b = process.env.MONGO_PORT) !== null && _b !== void 0 ? _b : '27017';
                    database = (_c = process.env.MONGO_DATABASE) !== null && _c !== void 0 ? _c : 'question_db';
                    uri = (_d = process.env.MONGO_URI) !== null && _d !== void 0 ? _d : "mongodb://" + host + ":" + port + "/" + database;
                    console.log("MongoDB: " + uri);
                    return [4 /*yield*/, mongoose_1["default"].connect(uri)];
                case 1:
                    _e.sent();
                    db = mongoose_1["default"].connection.db;
                    if (!db) {
                        throw new Error('MongoDB 连接未就绪（connection.db 为空）');
                    }
                    questions = db.collection('questions');
                    templates = db.collection('templates');
                    return [4 /*yield*/, questions.find({ isTemplate: true }).toArray()];
                case 2:
                    legacyTemplates = _e.sent();
                    if (!(legacyTemplates.length === 0)) return [3 /*break*/, 4];
                    console.log('未发现 legacy 模板数据（questions.isTemplate=true）。');
                    return [4 /*yield*/, mongoose_1["default"].disconnect()];
                case 3:
                    _e.sent();
                    return [2 /*return*/];
                case 4:
                    ops = legacyTemplates.map(function (doc) {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        return ({
                            updateOne: {
                                // 迁移时保留同一 _id，避免前端模板链接失效。
                                filter: { _id: doc._id },
                                update: {
                                    $set: {
                                        title: (_a = doc.title) !== null && _a !== void 0 ? _a : '未命名模板',
                                        templateDesc: (_b = doc.templateDesc) !== null && _b !== void 0 ? _b : '',
                                        js: (_c = doc.js) !== null && _c !== void 0 ? _c : '',
                                        css: (_d = doc.css) !== null && _d !== void 0 ? _d : '',
                                        sort: (_e = doc.sort) !== null && _e !== void 0 ? _e : 0,
                                        templateStatus: (_f = doc.templateStatus) !== null && _f !== void 0 ? _f : 'draft',
                                        author: (_g = doc.author) !== null && _g !== void 0 ? _g : '',
                                        sourceQuestionId: String(doc._id),
                                        useCount: 0,
                                        componentList: normalizeComponentList(doc.componentList),
                                        createdAt: (_h = doc.createdAt) !== null && _h !== void 0 ? _h : new Date(),
                                        updatedAt: (_j = doc.updatedAt) !== null && _j !== void 0 ? _j : new Date()
                                    }
                                },
                                upsert: true
                            }
                        });
                    });
                    return [4 /*yield*/, templates.bulkWrite(ops)];
                case 5:
                    result = _e.sent();
                    console.log("\u8FC1\u79FB\u5B8C\u6210\uFF1A\u8BFB\u53D6 " + legacyTemplates.length + " \u6761\uFF0Cupsert " + result.upsertedCount + " \u6761\uFF0C\u66F4\u65B0 " + result.modifiedCount + " \u6761\u3002");
                    return [4 /*yield*/, mongoose_1["default"].disconnect()];
                case 6:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (err) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.error('migrate templates failed:', err);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, mongoose_1["default"].disconnect()];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                return [3 /*break*/, 4];
            case 4:
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
