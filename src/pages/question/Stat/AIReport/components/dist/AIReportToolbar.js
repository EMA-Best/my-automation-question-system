'use strict';
exports.__esModule = true;
var antd_1 = require('antd');
var index_module_scss_1 = require('../index.module.scss');
var AIReportToolbar = function (_a) {
  var state = _a.state,
    mode = _a.mode,
    onModeChange = _a.onModeChange,
    onGenerate = _a.onGenerate,
    onRegenerate = _a.onRegenerate,
    onExport = _a.onExport,
    canExport = _a.canExport;
  var getStatusLabel = function (state) {
    switch (state) {
      case 'idle':
        return '未生成';
      case 'generating':
        return '生成中';
      case 'success':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };
  return React.createElement(
    'div',
    { className: index_module_scss_1['default'].toolbar },
    React.createElement(
      'div',
      { className: index_module_scss_1['default'].buttons },
      React.createElement(antd_1.Select, {
        value: mode,
        disabled: state === 'generating',
        onChange: function (value) {
          return onModeChange(value);
        },
        options: [
          { value: 'quick', label: '快速模式' },
          { value: 'standard', label: '标准模式' },
          { value: 'deep', label: '深度模式' },
        ],
        style: { width: 120 },
      }),
      state === 'idle' &&
        React.createElement(
          antd_1.Button,
          { type: 'primary', onClick: onGenerate },
          '\u751F\u6210\u62A5\u544A'
        ),
      state === 'success' &&
        React.createElement(
          antd_1.Button,
          { onClick: onRegenerate },
          '\u91CD\u65B0\u751F\u6210'
        ),
      React.createElement(
        antd_1.Button,
        { onClick: onExport, disabled: state === 'generating' || !canExport },
        '\u5BFC\u51FA\u62A5\u544A'
      )
    ),
    React.createElement(
      'div',
      { className: index_module_scss_1['default'].status },
      React.createElement(
        'span',
        { className: index_module_scss_1['default'].statusLabel },
        '\u72B6\u6001\uFF1A'
      ),
      React.createElement(
        'span',
        {
          className:
            index_module_scss_1['default'].statusBadge +
            ' ' +
            index_module_scss_1['default'][state],
        },
        getStatusLabel(state)
      )
    )
  );
};
exports['default'] = AIReportToolbar;
