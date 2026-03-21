'use strict';
/**
 * @description 加载单条问卷数据的hook
 * @description 从后端获取问卷数据
 * @description 以load的hook命名代表从后端获取数据
 */
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
var react_router_dom_1 = require('react-router-dom');
var react_router_dom_2 = require('react-router-dom');
var question_1 = require('../services/question');
var template_1 = require('../services/template');
var ahooks_1 = require('ahooks');
var react_redux_1 = require('react-redux');
var componentsReducer_1 = require('../store/componentsReducer');
var react_1 = require('react');
var pageInfoReducer_1 = require('../store/pageInfoReducer');
// 加载单条问卷数据的hook
var useLoadQuestionData = function () {
  // 从路由参数中获取问卷id
  var _a = react_router_dom_1.useParams().id,
    id = _a === void 0 ? '' : _a;
  var searchParams = react_router_dom_2.useSearchParams()[0];
  var isTemplateMode = searchParams.get('mode') === 'template';
  var dispatch = react_redux_1.useDispatch();
  // ajax加载问卷数据
  var _b = ahooks_1.useRequest(
      function (id) {
        return __awaiter(void 0, void 0, void 0, function () {
          var template, question;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (!id)
                  throw new Error(
                    isTemplateMode ? '没有模板 id' : '没有问卷 id'
                  );
                if (!isTemplateMode) return [3 /*break*/, 2];
                return [
                  4 /*yield*/,
                  template_1.getAdminTemplateDetailService(id),
                ];
              case 1:
                template = _a.sent();
                return [
                  2 /*return*/,
                  {
                    _id: template.id,
                    title: template.title,
                    desc: template.desc,
                    js: template.js,
                    css: template.css,
                    isPublished: template.templateStatus === 'published',
                    componentList: template.componentList,
                  },
                ];
              case 2:
                return [4 /*yield*/, question_1.getQuestionService(id)];
              case 3:
                question = _a.sent();
                return [2 /*return*/, question];
            }
          });
        });
      },
      {
        manual: true,
      }
    ),
    data = _b.data,
    loading = _b.loading,
    error = _b.error,
    run = _b.run;
  // 根据获取的data 设置 redux store
  react_1.useEffect(
    function () {
      if (!data) return;
      var _a = data.title,
        title = _a === void 0 ? '' : _a,
        _b = data.desc,
        desc = _b === void 0 ? '' : _b,
        _c = data.js,
        js = _c === void 0 ? '' : _c,
        _d = data.css,
        css = _d === void 0 ? '' : _d,
        _e = data.isPublished,
        isPublished = _e === void 0 ? false : _e,
        auditStatus = data.auditStatus,
        auditReason = data.auditReason,
        _f = data.componentList,
        componentList = _f === void 0 ? [] : _f;
      // 获取默认的selectedId
      var selectedId = '';
      // 如果组件列表不为空，默认选中第一个组件
      if (componentList.length > 0) {
        selectedId = componentList[0].fe_id;
      }
      // 把 componentList 存储到Redux store中
      dispatch(
        componentsReducer_1.resetComponents({
          componentList: componentList,
          selectedId: selectedId,
        })
      );
      // 把问卷信息存储到Redux store中
      dispatch(
        pageInfoReducer_1.resetPageInfo({
          title: title,
          desc: desc,
          js: js,
          css: css,
          isPublished: isPublished,
          auditStatus: auditStatus,
          auditReason: auditReason,
        })
      );
    },
    [data]
  );
  // 根据id变化，判断执行ajax 加载问卷数据
  react_1.useEffect(
    function () {
      run(id);
    },
    [id, isTemplateMode]
  );
  return { loading: loading, error: error };
  // async function load() {
  //   const data = await getQuestionService(id);
  //   return data;
  // }
  // const { loading, data, error } = useRequest(load);
  // return { loading, data, error };
};
exports['default'] = useLoadQuestionData;
