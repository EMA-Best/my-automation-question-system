'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
exports.regenerateQuestionAIReportService =
  exports.getQuestionAIReportTaskStatusService =
  exports.generateQuestionAIReportService =
  exports.getQuestionAIReportLatestService =
  exports.getComponentStatStatService =
  exports.getQuestionAnswerCountBatchService =
  exports.getQuestionStatListService =
  exports.getHomeStatService =
    void 0;
var ajax_1 = require('./ajax');
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    var parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
/**
 * 将后端返回的各种 id 形态归一化为 string。
 *
 * 常见情况：
 * - string："66f..."
 * - number：123（少见，但做兼容）
 * - Mongo 扩展 JSON：{ $oid: "66f..." }
 */
function normalizeId(value) {
  if (typeof value === 'string') {
    var trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (isRecord(value)) {
    var oid = value.$oid;
    if (typeof oid === 'string' && oid.trim().length > 0) return oid.trim();
  }
  return null;
}
/**
 * 解析批量答卷数接口返回
 * - 兼容 value 为数组 或 { list: [] }
 * - 兼容字段名：questionId / id / _id
 * - 兼容字段名：answerCount / count / total
 */
function parseQuestionAnswerCountList(value) {
  var listRaw = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.list)
      ? value.list
      : [];
  var list = [];
  listRaw.forEach(function (item) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!isRecord(item)) return;
    var questionId = normalizeId(
      (_e =
        (_d =
          (_c =
            (_b =
              (_a = item.questionId) !== null && _a !== void 0
                ? _a
                : item.questionnaireId) !== null && _b !== void 0
              ? _b
              : item.question_id) !== null && _c !== void 0
            ? _c
            : item.qid) !== null && _d !== void 0
          ? _d
          : item.id) !== null && _e !== void 0
        ? _e
        : item._id
    );
    if (!questionId) return;
    var answerCountRaw =
      (_j =
        (_h =
          (_g =
            (_f = item.answerCount) !== null && _f !== void 0
              ? _f
              : item.answer_count) !== null && _g !== void 0
            ? _g
            : item.count) !== null && _h !== void 0
          ? _h
          : item.total) !== null && _j !== void 0
        ? _j
        : item.answersCount;
    list.push({
      questionId: questionId,
      answerCount: toNumber(answerCountRaw),
    });
  });
  return list;
}
function parseQuestionStatListRes(value) {
  if (!isRecord(value)) return { total: 0, list: [] };
  var totalRaw = value.total;
  var listRaw = value.list;
  var total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0;
  var list = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach(function (item) {
      if (!isRecord(item)) return;
      var id = item._id;
      if (typeof id !== 'string') return;
      list.push(__assign(__assign({}, item), { _id: id }));
    });
  }
  return { total: total, list: list };
}
function parseHomeStatRes(value) {
  if (!isRecord(value)) {
    return { createdCount: 0, publishedCount: 0, answerCount: 0 };
  }
  var createdRaw = value.createdCount;
  var publishedRaw = value.publishedCount;
  var answerRaw = value.answerCount;
  var createdCount =
    typeof createdRaw === 'number' ? createdRaw : Number(createdRaw) || 0;
  var publishedCount =
    typeof publishedRaw === 'number' ? publishedRaw : Number(publishedRaw) || 0;
  var answerCount =
    typeof answerRaw === 'number' ? answerRaw : Number(answerRaw) || 0;
  return {
    createdCount: createdCount,
    publishedCount: publishedCount,
    answerCount: answerCount,
  };
}
// 首页统计：创建问卷数、发布问卷数、答卷总数
function getHomeStatService() {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/overview';
          return [4 /*yield*/, ajax_1['default'].get(url)];
        case 1:
          data = _a.sent();
          return [2 /*return*/, parseHomeStatRes(data)];
      }
    });
  });
}
exports.getHomeStatService = getHomeStatService;
// 获取问卷的统计列表
function getQuestionStatListService(questionId, opt) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/' + questionId;
          return [4 /*yield*/, ajax_1['default'].get(url, { params: opt })];
        case 1:
          data = _a.sent();
          return [2 /*return*/, parseQuestionStatListRes(data)];
      }
    });
  });
}
exports.getQuestionStatListService = getQuestionStatListService;
/**
 * 批量获取“问卷答卷数”
 *
 * 后端接口示例：
 * - POST /api/stat/questions/answer-count
 * - body: { questionIds: string[] }
 * - data: { list: Array<{ questionId: string; answerCount: number }> }
 */
function getQuestionAnswerCountBatchService(questionIds) {
  return __awaiter(this, void 0, Promise, function () {
    var url, uniqueIds, data, list, map;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/questions/answer-count';
          uniqueIds = Array.from(
            new Set(
              questionIds.filter(function (id) {
                return typeof id === 'string' && id.length > 0;
              })
            )
          );
          // 空数组时不发请求，避免后端做无意义校验
          if (uniqueIds.length === 0) return [2 /*return*/, {}];
          return [
            4 /*yield*/,
            ajax_1['default'].post(url, { questionIds: uniqueIds }),
          ];
        case 1:
          data = _a.sent();
          list = parseQuestionAnswerCountList(data);
          map = {};
          list.forEach(function (row) {
            map[row.questionId] = row.answerCount;
          });
          uniqueIds.forEach(function (id) {
            if (typeof map[id] !== 'number') map[id] = 0;
          });
          return [2 /*return*/, map];
      }
    });
  });
}
exports.getQuestionAnswerCountBatchService = getQuestionAnswerCountBatchService;
// 获取组件统计数据汇总
function getComponentStatStatService(questionId, componentId) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/' + questionId + '/' + componentId;
          return [4 /*yield*/, ajax_1['default'].get(url)];
        case 1:
          data = _a.sent();
          return [2 /*return*/, data];
      }
    });
  });
}
exports.getComponentStatStatService = getComponentStatStatService;
// 获取最新 AI 报告
function getQuestionAIReportLatestService(questionId) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/' + questionId + '/ai-report/latest';
          return [4 /*yield*/, ajax_1['default'].get(url)];
        case 1:
          data = _a.sent();
          return [2 /*return*/, data];
      }
    });
  });
}
exports.getQuestionAIReportLatestService = getQuestionAIReportLatestService;
// 生成 AI 报告
function generateQuestionAIReportService(questionId, payload) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          url = '/api/stat/' + questionId + '/ai-report/generate';
          console.log('创建 AI 报告任务:', url, payload);
          return [
            4 /*yield*/,
            ajax_1['default'].post(url, payload, {
              timeout: 30 * 1000,
            }),
          ];
        case 1:
          data = _a.sent();
          console.log('AI 报告任务创建成功:', data);
          return [2 /*return*/, data];
        case 2:
          error_1 = _a.sent();
          console.error('创建 AI 报告任务失败:', error_1);
          throw error_1;
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
exports.generateQuestionAIReportService = generateQuestionAIReportService;
// 查询 AI 报告任务状态
function getQuestionAIReportTaskStatusService(questionId, taskId) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/' + questionId + '/ai-report/tasks/' + taskId;
          return [
            4 /*yield*/,
            ajax_1['default'].get(url, {
              timeout: 30 * 1000,
            }),
          ];
        case 1:
          data = _a.sent();
          return [2 /*return*/, data];
      }
    });
  });
}
exports.getQuestionAIReportTaskStatusService =
  getQuestionAIReportTaskStatusService;
// 重新生成 AI 报告
function regenerateQuestionAIReportService(questionId, payload) {
  return __awaiter(this, void 0, Promise, function () {
    var url, data;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url = '/api/stat/' + questionId + '/ai-report/regenerate';
          return [
            4 /*yield*/,
            ajax_1['default'].post(url, payload, {
              timeout: 30 * 1000,
            }),
          ];
        case 1:
          data = _a.sent();
          return [2 /*return*/, data];
      }
    });
  });
}
exports.regenerateQuestionAIReportService = regenerateQuestionAIReportService;
