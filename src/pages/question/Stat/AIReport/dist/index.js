'use strict';
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
var react_1 = require('react');
var antd_1 = require('antd');
var react_router_dom_1 = require('react-router-dom');
var index_module_scss_1 = require('./index.module.scss');
var AIReportToolbar_1 = require('./components/AIReportToolbar');
var AIReportSummary_1 = require('./components/AIReportSummary');
var AIReportInsights_1 = require('./components/AIReportInsights');
var AIReportRisks_1 = require('./components/AIReportRisks');
var AIReportRecommendations_1 = require('./components/AIReportRecommendations');
var AIReportEmpty_1 = require('./components/AIReportEmpty');
var stat_1 = require('../../../../services/stat');
var sleep = function (ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
};
var escapeHtml = function (value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
var normalizeQuestionTitle = function (value) {
  return value.replace(/^\s*\d+\s*[.。．、]\s*/, '').trim();
};
var AIReport = function () {
  var questionId = react_router_dom_1.useParams().id;
  var _a = react_1.useState('idle'),
    state = _a[0],
    setState = _a[1];
  var _b = react_1.useState(null),
    report = _b[0],
    setReport = _b[1];
  var _c = react_1.useState(''),
    error = _c[0],
    setError = _c[1];
  var _d = react_1.useState('standard'),
    mode = _d[0],
    setMode = _d[1];
  var buildReportPrintHtml = function (data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var highlightsHtml = (data.highlights || [])
      .map(function (item, idx) {
        return (
          '\n          <div class="item">\n            <div class="item-title">' +
          (idx + 1) +
          '. ' +
          escapeHtml(item.title || '-') +
          '</div>\n            <div>\u8BE6\u60C5\uFF1A' +
          escapeHtml(item.detail || '-') +
          '</div>\n            <div>\u4F9D\u636E\u9898\u76EE\uFF1A' +
          escapeHtml((item.evidenceQuestionIds || []).join(', ') || '-') +
          '</div>\n          </div>\n        '
        );
      })
      .join('');
    var insightsHtml = (data.questionInsights || [])
      .map(function (item, idx) {
        return (
          '\n          <div class="item">\n            <div class="item-title">' +
          (idx + 1) +
          '. ' +
          escapeHtml(normalizeQuestionTitle(item.questionTitle || '-')) +
          '</div>\n            <div>\u53D1\u73B0\uFF1A' +
          escapeHtml(item.finding || '-') +
          '</div>\n            <div>\u4F9D\u636E\uFF1A' +
          escapeHtml(item.evidence || '-') +
          '</div>\n            <div>\u56FE\u8868\u63D0\u793A\uFF1A' +
          escapeHtml(item.chartHint || '-') +
          '</div>\n          </div>\n        '
        );
      })
      .join('');
    var risksHtml = (data.risks || [])
      .map(function (item) {
        return '<li>' + escapeHtml(item || '-') + '</li>';
      })
      .join('');
    var recommendationsHtml = (data.recommendations || [])
      .map(function (item) {
        return '<li>' + escapeHtml(item || '-') + '</li>';
      })
      .join('');
    var confidenceNotesHtml = (data.confidenceNotes || [])
      .map(function (item) {
        return '<li>' + escapeHtml(item || '-') + '</li>';
      })
      .join('');
    return (
      '\n      <!doctype html>\n      <html lang="zh-CN">\n        <head>\n          <meta charset="UTF-8" />\n          <title>AI \u5206\u6790\u62A5\u544A</title>\n          <style>\n            @page { size: A4; margin: 14mm; }\n            body {\n              font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimSun", sans-serif;\n              color: #222;\n              line-height: 1.6;\n              font-size: 12px;\n            }\n            h1 { font-size: 24px; margin: 0 0 8px; }\n            h2 { font-size: 18px; margin: 20px 0 8px; border-left: 4px solid #1677ff; padding-left: 8px; }\n            .meta { color: #666; margin-bottom: 4px; }\n            .block { margin: 8px 0; }\n            .item { margin: 10px 0; padding: 8px 10px; background: #f7f9fc; border-radius: 6px; }\n            .item-title { font-weight: 700; margin-bottom: 4px; }\n            ol { margin: 6px 0 0 18px; padding: 0; }\n            li { margin: 4px 0; }\n          </style>\n        </head>\n        <body>\n          <h1>AI \u5206\u6790\u62A5\u544A</h1>\n          <div class="meta">\u95EE\u5377 ID\uFF1A' +
      escapeHtml(questionId || 'unknown') +
      '</div>\n          <div class="meta">\u5BFC\u51FA\u65F6\u95F4\uFF1A' +
      escapeHtml(new Date().toLocaleString()) +
      '</div>\n\n          <h2>1. \u6267\u884C\u6458\u8981</h2>\n          <div class="block"><strong>\u6807\u9898\uFF1A</strong>' +
      escapeHtml(
        ((_a = data.summary) === null || _a === void 0
          ? void 0
          : _a.headline) || '-'
      ) +
      '</div>\n          <div class="block"><strong>\u5185\u5BB9\uFF1A</strong>' +
      escapeHtml(
        ((_b = data.summary) === null || _b === void 0 ? void 0 : _b.brief) ||
          '-'
      ) +
      '</div>\n\n          <h2>2. \u6837\u672C\u6982\u89C8</h2>\n          <div class="block">\u603B\u6837\u672C\u6570\uFF1A' +
      ((_d =
        (_c = data.sampleOverview) === null || _c === void 0
          ? void 0
          : _c.totalAnswers) !== null && _d !== void 0
        ? _d
        : 0) +
      '</div>\n          <div class="block">\u6709\u6548\u6837\u672C\uFF1A' +
      ((_f =
        (_e = data.sampleOverview) === null || _e === void 0
          ? void 0
          : _e.validAnswers) !== null && _f !== void 0
        ? _f
        : 0) +
      '</div>\n          <div class="block">\u6587\u672C\u8986\u76D6\u7387\uFF1A' +
      ((_h =
        (_g = data.sampleOverview) === null || _g === void 0
          ? void 0
          : _g.textCoverage) !== null && _h !== void 0
        ? _h
        : 0) +
      '%</div>\n\n          <h2>3. \u5173\u952E\u53D1\u73B0</h2>\n          ' +
      (highlightsHtml || '<div class="block">暂无</div>') +
      '\n\n          <h2>4. \u9898\u76EE\u6D1E\u5BDF</h2>\n          ' +
      (insightsHtml || '<div class="block">暂无</div>') +
      '\n\n          <h2>5. \u98CE\u9669\u63D0\u793A</h2>\n          ' +
      (risksHtml
        ? '<ol>' + risksHtml + '</ol>'
        : '<div class="block">暂无</div>') +
      '\n\n          <h2>6. \u884C\u52A8\u5EFA\u8BAE</h2>\n          ' +
      (recommendationsHtml
        ? '<ol>' + recommendationsHtml + '</ol>'
        : '<div class="block">暂无</div>') +
      '\n\n          <h2>7. \u7F6E\u4FE1\u5EA6\u8BF4\u660E</h2>\n          ' +
      (confidenceNotesHtml
        ? '<ol>' + confidenceNotesHtml + '</ol>'
        : '<div class="block">暂无</div>') +
      '\n        </body>\n      </html>\n    '
    );
  };
  var handleExportReport = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var iframe_1, doc;
      var _a;
      return __generator(this, function (_b) {
        if (!report) {
          antd_1.message.warning('当前没有可导出的报告');
          return [2 /*return*/];
        }
        try {
          iframe_1 = document.createElement('iframe');
          iframe_1.style.position = 'fixed';
          iframe_1.style.right = '0';
          iframe_1.style.bottom = '0';
          iframe_1.style.width = '0';
          iframe_1.style.height = '0';
          iframe_1.style.border = '0';
          iframe_1.setAttribute('aria-hidden', 'true');
          document.body.appendChild(iframe_1);
          doc =
            iframe_1.contentDocument ||
            ((_a = iframe_1.contentWindow) === null || _a === void 0
              ? void 0
              : _a.document);
          if (!doc || !iframe_1.contentWindow) {
            document.body.removeChild(iframe_1);
            antd_1.message.error('打印环境初始化失败，请重试');
            return [2 /*return*/];
          }
          doc.open();
          doc.write(buildReportPrintHtml(report));
          doc.close();
          iframe_1.onload = function () {
            var _a, _b;
            (_a = iframe_1.contentWindow) === null || _a === void 0
              ? void 0
              : _a.focus();
            (_b = iframe_1.contentWindow) === null || _b === void 0
              ? void 0
              : _b.print();
            // 给浏览器一点时间触发打印，再清理节点
            setTimeout(function () {
              if (iframe_1.parentNode) {
                iframe_1.parentNode.removeChild(iframe_1);
              }
            }, 1000);
          };
          antd_1.message.success('已唤起打印，请选择“另存为 PDF”');
        } catch (e) {
          console.error('导出报告失败:', e);
          antd_1.message.error('导出失败，请重试');
        }
        return [2 /*return*/];
      });
    });
  };
  // 加载最新报告
  var loadLatestReport = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var data, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!questionId) return [2 /*return*/];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              stat_1.getQuestionAIReportLatestService(questionId),
            ];
          case 2:
            data = _a.sent();
            if (data) {
              setReport(data);
              setState('success');
            } else {
              setState('idle');
            }
            return [3 /*break*/, 4];
          case 3:
            err_1 = _a.sent();
            console.error('Failed to load latest report:', err_1);
            setState('idle');
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  // 生成报告
  var handleGenerateReport = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var task,
        maxAttempts,
        intervalMs,
        reportData,
        attempt,
        statusData,
        err_2,
        errorMessage;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!questionId) return [2 /*return*/];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 8, , 9]);
            setState('generating');
            setError('');
            return [
              4 /*yield*/,
              stat_1.generateQuestionAIReportService(questionId, {
                mode: mode,
                timeRange: 'all',
                includeTextAnswers: true,
                maxAnswers: mode === 'quick' ? 80 : mode === 'deep' ? 300 : 180,
              }),
            ];
          case 2:
            task = _a.sent();
            maxAttempts = 90;
            intervalMs = 2000;
            reportData = null;
            attempt = 0;
            _a.label = 3;
          case 3:
            if (!(attempt < maxAttempts)) return [3 /*break*/, 7];
            return [
              4 /*yield*/,
              stat_1.getQuestionAIReportTaskStatusService(
                questionId,
                task.taskId
              ),
            ];
          case 4:
            statusData = _a.sent();
            if (statusData.status === 'succeeded') {
              reportData = statusData.report;
              return [3 /*break*/, 7];
            }
            if (statusData.status === 'failed') {
              throw new Error(statusData.errorMessage || '生成任务失败');
            }
            return [4 /*yield*/, sleep(intervalMs)];
          case 5:
            _a.sent();
            _a.label = 6;
          case 6:
            attempt++;
            return [3 /*break*/, 3];
          case 7:
            if (!reportData) {
              throw new Error('生成超时，请稍后重试');
            }
            setReport(reportData);
            setState('success');
            return [3 /*break*/, 9];
          case 8:
            err_2 = _a.sent();
            console.error('Failed to generate report:', err_2);
            errorMessage =
              err_2 instanceof Error ? err_2.message : '生成报告失败，请重试';
            setError(errorMessage);
            setState('failed');
            return [3 /*break*/, 9];
          case 9:
            return [2 /*return*/];
        }
      });
    });
  };
  // 重新生成报告
  var handleRegenerateReport = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, handleGenerateReport()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  // 初始加载
  react_1.useEffect(
    function () {
      loadLatestReport();
    },
    [questionId]
  );
  // 渲染不同状态的内容
  var renderContent = function () {
    switch (state) {
      case 'idle':
        return React.createElement(AIReportEmpty_1['default'], {
          onGenerate: handleGenerateReport,
        });
      case 'generating':
        return React.createElement(
          'div',
          { className: index_module_scss_1['default'].loadingContainer },
          React.createElement(antd_1.Spin, {
            size: 'large',
            tip: '\u6B63\u5728\u751F\u6210\u62A5\u544A...',
          })
        );
      case 'failed':
        return React.createElement(antd_1.Alert, {
          message: '\u751F\u6210\u5931\u8D25',
          description: error || '生成报告时发生错误，请重试',
          type: 'error',
          showIcon: true,
          action: React.createElement(
            'button',
            {
              className: index_module_scss_1['default'].retryButton,
              onClick: handleRegenerateReport,
            },
            '\u91CD\u8BD5'
          ),
        });
      case 'success':
        if (!report)
          return React.createElement(AIReportEmpty_1['default'], {
            onGenerate: handleGenerateReport,
          });
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(AIReportSummary_1['default'], {
            summary: report.summary,
            sampleOverview: report.sampleOverview,
          }),
          React.createElement(AIReportInsights_1['default'], {
            highlights: report.highlights,
            questionInsights: report.questionInsights,
          }),
          React.createElement(AIReportRisks_1['default'], {
            risks: report.risks,
          }),
          React.createElement(AIReportRecommendations_1['default'], {
            recommendations: report.recommendations,
          })
        );
      default:
        return null;
    }
  };
  return React.createElement(
    'div',
    { className: index_module_scss_1['default'].container },
    React.createElement(AIReportToolbar_1['default'], {
      state: state,
      mode: mode,
      onModeChange: setMode,
      onGenerate: handleGenerateReport,
      onRegenerate: handleRegenerateReport,
      onExport: handleExportReport,
      canExport: !!report,
    }),
    React.createElement(
      'div',
      { className: index_module_scss_1['default'].content },
      renderContent()
    )
  );
};
exports['default'] = AIReport;
