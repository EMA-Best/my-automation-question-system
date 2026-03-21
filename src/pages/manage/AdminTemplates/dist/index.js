'use strict';
/**
 * @file 管理员 - 模板管理页面
 * @description 对应文档 §4.1.1（页面与路由），提供模板的列表查看、创建、发布/下线、删除等管理能力。
 *
 * 页面结构：
 *  ┌─ 查询表单（关键词 + 模板状态筛选）
 *  ├─ 操作栏（新建模板 + 刷新）
 *  ├─ 模板列表（Table 分页）
 *  └─ 创建模板弹窗（Modal）
 *
 * 核心设计决策（与文档对齐）：
 *  1. 模板管理页仅 admin 可见（由路由层 + Access 组件控制）。
 *  2. 列表展示 draft + published 所有状态的模板（文档 §3.3.1）。
 *  3. "发布"操作对应后端 POST /api/admin/templates/:id/publish。
 *  4. "下线"操作对应后端 POST /api/admin/templates/:id/unpublish。
 *  5. 操作按钮通过 data-* 属性做事件委托，减少闭包开销（复用 AdminQuestions 模式）。
 */
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
var react_1 = require('react');
var antd_1 = require('antd');
var icons_1 = require('@ant-design/icons');
var ahooks_1 = require('ahooks');
var QuestionComponents_1 = require('../../../components/QuestionComponents');
var template_1 = require('../../../services/template');
var formatDateTime_1 = require('../../../utils/formatDateTime');
var index_module_scss_1 = require('./index.module.scss');
var Title = antd_1.Typography.Title;
// ─── 模板状态 → 颜色/文案映射 ─────────────────────────────
/** 模板状态对应的 Tag 颜色 */
var templateStatusColorMap = {
  draft: 'default',
  published: 'success',
};
/** 模板状态对应的中文文案 */
var templateStatusTextMap = {
  draft: '草稿',
  published: '已发布',
};
/** 默认查询状态 */
var defaultQueryState = {
  keyword: '',
  templateStatus: undefined,
};
/**
 * 管理员模板管理页面组件
 *
 * 复用了 AdminQuestions 的交互模式：
 * - 查询表单 + 分页表格
 * - 操作按钮通过 data-action / data-id 做事件委托
 * - 危险操作（发布/下线/删除）使用 Modal.confirm 二次确认
 */
var AdminTemplates = function (props) {
  var _a, _b, _c;
  // ── 页面标题 ──────────────────────────────────────────
  var pageTitle =
    (_a = props.pageTitle) !== null && _a !== void 0
      ? _a
      : '小伦问卷 - 模板管理';
  var headerTitle =
    (_b = props.headerTitle) !== null && _b !== void 0 ? _b : '模板管理';
  ahooks_1.useTitle(pageTitle);
  // ── 查询表单 ──────────────────────────────────────────
  var form = antd_1.Form.useForm()[0];
  var _d = react_1.useState(defaultQueryState),
    queryState = _d[0],
    setQueryState = _d[1];
  // ── 分页状态 ──────────────────────────────────────────
  var _e = react_1.useState(1),
    page = _e[0],
    setPage = _e[1];
  var _f = react_1.useState(10),
    pageSize = _f[0],
    setPageSize = _f[1];
  // ── 数据请求：获取模板列表 ───────────────────────────
  /**
   * 封装列表请求逻辑
   * refreshDeps 确保页码/每页条数/查询条件变化时自动重新请求
   */
  var fetchList = react_1.useCallback(
    function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                template_1.getAdminTemplateListService({
                  page: page,
                  pageSize: pageSize,
                  keyword: queryState.keyword || undefined,
                  templateStatus: queryState.templateStatus,
                }),
              ];
            case 1:
              res = _a.sent();
              return [2 /*return*/, res];
          }
        });
      });
    },
    [page, pageSize, queryState]
  );
  var _g = ahooks_1.useRequest(fetchList, {
      refreshDeps: [page, pageSize, queryState],
    }),
    data = _g.data,
    loading = _g.loading,
    refresh = _g.refresh;
  // ── 派生数据 ──────────────────────────────────────────
  /** 表格数据源 */
  var tableDataSource = react_1.useMemo(
    function () {
      var _a;
      return (_a = data === null || data === void 0 ? void 0 : data.list) !==
        null && _a !== void 0
        ? _a
        : [];
    },
    [data]
  );
  /** 构建 id → 行数据 的快速查找 Map */
  var templateById = react_1.useMemo(
    function () {
      var map = new Map();
      tableDataSource.forEach(function (t) {
        return map.set(t.id, t);
      });
      return map;
    },
    [tableDataSource]
  );
  /** 总条数 */
  var total =
    (_c = data === null || data === void 0 ? void 0 : data.count) !== null &&
    _c !== void 0
      ? _c
      : 0;
  // ── 预览抽屉 ───────────────────────────────────────────
  var _h = react_1.useState(false),
    previewOpen = _h[0],
    setPreviewOpen = _h[1];
  var _j = ahooks_1.useRequest(
      function (templateId) {
        return __awaiter(void 0, void 0, void 0, function () {
          var res;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  template_1.getAdminTemplateDetailService(templateId),
                ];
              case 1:
                res = _a.sent();
                return [2 /*return*/, res];
            }
          });
        });
      },
      {
        manual: true,
        onError: function (err) {
          antd_1.message.error(err.message || '加载模板预览失败');
        },
      }
    ),
    previewData = _j.data,
    previewLoading = _j.loading,
    loadPreview = _j.run;
  var openPreview = react_1.useCallback(
    function (templateId) {
      setPreviewOpen(true);
      loadPreview(templateId);
    },
    [loadPreview]
  );
  var closePreview = react_1.useCallback(function () {
    setPreviewOpen(false);
  }, []);
  var renderComponent = react_1.useCallback(function (componentInfo) {
    var componentConf = QuestionComponents_1.getComponentConfigByType(
      componentInfo.type
    );
    if (!componentConf) return null;
    var Component = componentConf.Component;
    return React.createElement(Component, __assign({}, componentInfo.props));
  }, []);
  var previewComponentList = react_1.useMemo(
    function () {
      var _a;
      var list =
        (_a =
          previewData === null || previewData === void 0
            ? void 0
            : previewData.componentList) !== null && _a !== void 0
          ? _a
          : [];
      return list.filter(function (c) {
        return !c.isHidden;
      });
    },
    [previewData]
  );
  // ── 查询表单交互 ─────────────────────────────────────
  /** 点击"查询"按钮 */
  var handleQueryClick = react_1.useCallback(
    function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var values, _a;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 2, , 3]);
              return [4 /*yield*/, form.validateFields()];
            case 1:
              values = _b.sent();
              setPage(1); // 查询时重置到第一页
              setQueryState(values);
              return [3 /*break*/, 3];
            case 2:
              _a = _b.sent();
              return [3 /*break*/, 3];
            case 3:
              return [2 /*return*/];
          }
        });
      });
    },
    [form]
  );
  /** 回车触发查询 */
  var handlePressEnterQuery = react_1.useCallback(
    function () {
      void handleQueryClick();
    },
    [handleQueryClick]
  );
  /** 点击"重置" */
  var onReset = react_1.useCallback(
    function () {
      setPage(1);
      form.setFieldsValue(defaultQueryState);
      setQueryState(defaultQueryState);
    },
    [form]
  );
  // ── 表格行操作（事件委托） ───────────────────────────
  /**
   * 统一的操作处理器
   *
   * 通过 data-action 和 data-id 属性识别点击了哪个操作，
   * 避免为每行每个按钮创建闭包，减少不必要的 re-render。
   */
  var handleActionClick = react_1.useCallback(
    function (evt) {
      var _a = evt.currentTarget.dataset,
        action = _a.action,
        id = _a.id;
      if (!action || !id) return;
      var row = templateById.get(id);
      if (!row) return;
      var typedAction = action;
      // ── 编辑模板：进入完整编辑页（支持结构编辑） ──
      if (typedAction === 'edit') {
        window.open('/question/edit/' + id + '?mode=template', '_blank');
        return;
      }
      // ── 预览模板 ──
      if (typedAction === 'preview') {
        openPreview(id);
        return;
      }
      // ── 发布模板（draft → published） ──
      if (typedAction === 'publish') {
        antd_1.Modal.confirm({
          title: '确认发布该模板？',
          content:
            '\u6A21\u677F\u300C' +
            row.title +
            '\u300D\u53D1\u5E03\u540E\u5C06\u5728 C \u7AEF\u516C\u5F00\u5C55\u793A\u3002',
          okText: '发布',
          cancelText: '取消',
          onOk: function () {
            return __awaiter(void 0, void 0, void 0, function () {
              var _a;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [
                      4 /*yield*/,
                      template_1.publishAdminTemplateService(id),
                    ];
                  case 1:
                    _b.sent();
                    antd_1.message.success('模板已发布');
                    refresh();
                    return [3 /*break*/, 3];
                  case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                  case 3:
                    return [2 /*return*/];
                }
              });
            });
          },
        });
        return;
      }
      // ── 下线模板（published → draft） ──
      if (typedAction === 'unpublish') {
        antd_1.Modal.confirm({
          title: '确认下线该模板？',
          content:
            '\u6A21\u677F\u300C' +
            row.title +
            '\u300D\u4E0B\u7EBF\u540E C \u7AEF\u5C06\u4E0D\u518D\u5C55\u793A\u3002',
          okText: '下线',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: function () {
            return __awaiter(void 0, void 0, void 0, function () {
              var _a;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [
                      4 /*yield*/,
                      template_1.unpublishAdminTemplateService(id),
                    ];
                  case 1:
                    _b.sent();
                    antd_1.message.success('模板已下线');
                    refresh();
                    return [3 /*break*/, 3];
                  case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                  case 3:
                    return [2 /*return*/];
                }
              });
            });
          },
        });
        return;
      }
      // ── 删除模板 ──
      if (typedAction === 'delete') {
        antd_1.Modal.confirm({
          title: '确认删除该模板？',
          content:
            '\u6A21\u677F\u300C' +
            row.title +
            '\u300D\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002',
          okText: '删除',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: function () {
            return __awaiter(void 0, void 0, void 0, function () {
              var _a;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [
                      4 /*yield*/,
                      template_1.deleteAdminTemplateService(id),
                    ];
                  case 1:
                    _b.sent();
                    antd_1.message.success('模板已删除');
                    refresh();
                    return [3 /*break*/, 3];
                  case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                  case 3:
                    return [2 /*return*/];
                }
              });
            });
          },
        });
      }
    },
    [openPreview, refresh, templateById]
  );
  // ── 表格列定义 ───────────────────────────────────────
  var columns = react_1.useMemo(
    function () {
      return [
        {
          title: '序号',
          key: 'index',
          width: 70,
          align: 'center',
          // 序号 = (当前页 - 1) * 每页条数 + 行索引 + 1
          render: function (_value, _row, index) {
            return React.createElement(
              'span',
              null,
              (page - 1) * pageSize + index + 1
            );
          },
        },
        {
          title: '模板标题',
          dataIndex: 'title',
          key: 'title',
          ellipsis: true,
        },
        {
          title: '模板描述',
          dataIndex: 'templateDesc',
          key: 'templateDesc',
          ellipsis: true,
          render: function (text) {
            return text || '-';
          },
        },
        {
          title: '状态',
          key: 'templateStatus',
          width: 100,
          render: function (_, row) {
            var color = templateStatusColorMap[row.templateStatus];
            var text = templateStatusTextMap[row.templateStatus];
            return React.createElement(antd_1.Tag, { color: color }, text);
          },
        },
        {
          title: '创建时间',
          dataIndex: 'createdAt',
          key: 'createdAt',
          width: 180,
          render: function (text) {
            return formatDateTime_1.formatDateTime(text);
          },
        },
        {
          title: '操作',
          key: 'actions',
          width: 280,
          render: function (_, row) {
            return React.createElement(
              antd_1.Space,
              { size: 4, wrap: true },
              React.createElement(
                antd_1.Button,
                {
                  type: 'link',
                  size: 'small',
                  icon: React.createElement(icons_1.EditOutlined, null),
                  'data-action': 'edit',
                  'data-id': row.id,
                  onClick: handleActionClick,
                },
                '\u7F16\u8F91'
              ),
              React.createElement(
                antd_1.Button,
                {
                  type: 'link',
                  size: 'small',
                  icon: React.createElement(icons_1.EyeOutlined, null),
                  'data-action': 'preview',
                  'data-id': row.id,
                  onClick: handleActionClick,
                },
                '\u9884\u89C8'
              ),
              row.templateStatus === 'draft'
                ? React.createElement(
                    antd_1.Button,
                    {
                      type: 'link',
                      size: 'small',
                      icon: React.createElement(icons_1.SendOutlined, null),
                      'data-action': 'publish',
                      'data-id': row.id,
                      onClick: handleActionClick,
                    },
                    '\u53D1\u5E03'
                  )
                : React.createElement(
                    antd_1.Button,
                    {
                      type: 'link',
                      size: 'small',
                      danger: true,
                      icon: React.createElement(icons_1.StopOutlined, null),
                      'data-action': 'unpublish',
                      'data-id': row.id,
                      onClick: handleActionClick,
                    },
                    '\u4E0B\u7EBF'
                  ),
              React.createElement(
                antd_1.Button,
                {
                  type: 'link',
                  size: 'small',
                  danger: true,
                  icon: React.createElement(icons_1.DeleteOutlined, null),
                  'data-action': 'delete',
                  'data-id': row.id,
                  onClick: handleActionClick,
                },
                '\u5220\u9664'
              )
            );
          },
        },
      ];
    },
    [page, pageSize, handleActionClick]
  );
  // ── 渲染 ─────────────────────────────────────────────
  return React.createElement(
    'div',
    { className: index_module_scss_1['default'].page },
    React.createElement(
      antd_1.Card,
      { style: { marginBottom: 16 } },
      React.createElement(
        Title,
        { level: 3, className: index_module_scss_1['default'].headerTitle },
        headerTitle
      )
    ),
    React.createElement(
      antd_1.Card,
      { style: { marginBottom: 16 } },
      React.createElement(
        antd_1.Form,
        {
          form: form,
          layout: 'inline',
          className: index_module_scss_1['default'].queryForm,
          initialValues: defaultQueryState,
        },
        React.createElement(
          antd_1.Row,
          { gutter: [16, 12], style: { width: '100%' } },
          React.createElement(
            antd_1.Col,
            { xs: 24, sm: 12, md: 8 },
            React.createElement(
              antd_1.Form.Item,
              { name: 'keyword', label: '\u5173\u952E\u8BCD' },
              React.createElement(antd_1.Input, {
                placeholder: '\u6A21\u677F\u6807\u9898 / \u63CF\u8FF0',
                allowClear: true,
                className: index_module_scss_1['default'].field,
                onPressEnter: handlePressEnterQuery,
              })
            )
          ),
          React.createElement(
            antd_1.Col,
            { xs: 24, sm: 12, md: 8 },
            React.createElement(
              antd_1.Form.Item,
              { name: 'templateStatus', label: '\u72B6\u6001' },
              React.createElement(
                antd_1.Select,
                {
                  placeholder: '\u5168\u90E8\u72B6\u6001',
                  allowClear: true,
                  className: index_module_scss_1['default'].field,
                },
                React.createElement(
                  antd_1.Select.Option,
                  { value: 'draft' },
                  '\u8349\u7A3F'
                ),
                React.createElement(
                  antd_1.Select.Option,
                  { value: 'published' },
                  '\u5DF2\u53D1\u5E03'
                )
              )
            )
          ),
          React.createElement(
            antd_1.Col,
            {
              xs: 24,
              sm: 24,
              md: 8,
              className: index_module_scss_1['default'].actionCol,
            },
            React.createElement(
              antd_1.Space,
              null,
              React.createElement(
                antd_1.Button,
                { type: 'primary', onClick: handleQueryClick },
                '\u67E5\u8BE2'
              ),
              React.createElement(
                antd_1.Button,
                { onClick: onReset },
                '\u91CD\u7F6E'
              )
            )
          )
        )
      )
    ),
    React.createElement(
      antd_1.Card,
      null,
      React.createElement(antd_1.Table, {
        rowKey: 'id',
        columns: columns,
        dataSource: tableDataSource,
        loading: loading,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: function (t) {
            return '\u5171 ' + t + ' \u6761';
          },
          onChange: function (p, ps) {
            setPage(p);
            setPageSize(ps);
          },
        },
        scroll: { x: 800 },
      })
    ),
    React.createElement(
      antd_1.Drawer,
      {
        title: '\u6A21\u677F\u9884\u89C8',
        open: previewOpen,
        width: 720,
        onClose: closePreview,
        destroyOnClose: true,
      },
      React.createElement(
        antd_1.Card,
        {
          loading: previewLoading,
          bordered: false,
          className: index_module_scss_1['default'].previewCard,
        },
        React.createElement(
          'div',
          { className: index_module_scss_1['default'].previewContent },
          previewComponentList.map(function (c) {
            return React.createElement(
              'div',
              {
                key: c.fe_id,
                className: index_module_scss_1['default'].previewBlock,
              },
              renderComponent(c)
            );
          }),
          !previewLoading && previewComponentList.length === 0
            ? React.createElement(
                antd_1.Typography.Text,
                { type: 'secondary' },
                '\u8BE5\u6A21\u677F\u6682\u65E0\u53EF\u9884\u89C8\u7684\u7EC4\u4EF6'
              )
            : null
        )
      )
    )
  );
};
exports['default'] = AdminTemplates;
