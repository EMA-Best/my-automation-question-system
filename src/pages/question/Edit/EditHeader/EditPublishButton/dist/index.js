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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
exports.__esModule = true;
var react_router_dom_1 = require('react-router-dom');
var useGetComponentInfo_1 = require('../../../../../hooks/useGetComponentInfo');
var useGetPageInfo_1 = require('../../../../../hooks/useGetPageInfo');
var ahooks_1 = require('ahooks');
var antd_1 = require('antd');
var question_1 = require('../../../../../services/question');
var useGetUserInfo_1 = require('../../../../../hooks/useGetUserInfo');
var EditPublishButton = function () {
  var id = react_router_dom_1.useParams().id;
  var navigate = react_router_dom_1.useNavigate();
  var _a = useGetComponentInfo_1['default']().componentList,
    componentList = _a === void 0 ? [] : _a;
  var pageInfo = useGetPageInfo_1['default']();
  var role = useGetUserInfo_1['default']().role;
  var auditStatus = pageInfo.auditStatus,
    auditReason = pageInfo.auditReason;
  var isPublished = pageInfo.isPublished;
  // 已发布问卷不可再次点击发布
  var canPublish =
    !isPublished && (role === 'admin' || auditStatus === 'Approved');
  // ajax 发布问卷
  var _b = ahooks_1.useRequest(
      function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var _auditStatus, _auditReason, rest;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!id) return [2 /*return*/];
                if (!canPublish) {
                  if (auditStatus === 'Rejected' && auditReason) {
                    throw new Error(
                      '\u5BA1\u6838\u672A\u901A\u8FC7\uFF1A' + auditReason
                    );
                  }
                  throw new Error('发布前需通过审核');
                }
                ((_auditStatus = pageInfo.auditStatus),
                  (_auditReason = pageInfo.auditReason),
                  (rest = __rest(pageInfo, ['auditStatus', 'auditReason'])));
                void _auditStatus;
                void _auditReason;
                return [
                  4 /*yield*/,
                  question_1.updateQuestionService(
                    id,
                    __assign(__assign({}, rest), {
                      componentList: componentList,
                      isPublished: true,
                    })
                  ),
                ];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      },
      {
        manual: true,
        onSuccess: function () {
          antd_1.message.success('发布成功');
          navigate('/question/stat/' + id); // 发布成功跳转到统计页面
        },
        onError: function (err) {
          antd_1.message.error(err.message || '发布失败');
        },
      }
    ),
    loading = _b.loading,
    publish = _b.run;
  var tooltipTitle = isPublished
    ? '该问卷已发布'
    : role === 'admin'
      ? ''
      : auditStatus === 'Rejected' && auditReason
        ? '\u5BA1\u6838\u672A\u901A\u8FC7\uFF1A' + auditReason
        : !canPublish
          ? '发布前需通过审核'
          : '';
  return React.createElement(
    antd_1.Tooltip,
    { title: tooltipTitle },
    React.createElement(
      'span',
      null,
      React.createElement(
        antd_1.Button,
        { type: 'primary', onClick: publish, disabled: loading || !canPublish },
        '\u53D1\u5E03'
      )
    )
  );
};
exports['default'] = EditPublishButton;
