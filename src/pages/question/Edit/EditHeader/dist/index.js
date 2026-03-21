'use strict';
exports.__esModule = true;
var index_module_scss_1 = require('./index.module.scss');
var antd_1 = require('antd');
var react_router_dom_1 = require('react-router-dom');
var icons_1 = require('@ant-design/icons');
var router_1 = require('../../../../router');
var EditToolbar_1 = require('./EditToolbar');
var EditTitle_1 = require('./EditTitle');
var EditSaveButton_1 = require('./EditSaveButton');
var EditPublishButton_1 = require('./EditPublishButton');
var EditSubmitReviewButton_1 = require('./EditSubmitReviewButton');
var EditExportButton_1 = require('./EditExportButton');
var EditImportButton_1 = require('./EditImportButton');
var EditAIGenerateButton_1 = require('./EditAIGenerateButton');
var EditSaveAsTemplateButton_1 = require('./EditSaveAsTemplateButton');
var EditHeader = function () {
  var navigate = react_router_dom_1.useNavigate();
  var searchParams = react_router_dom_1.useSearchParams()[0];
  var isTemplateMode = searchParams.get('mode') === 'template';
  return React.createElement(
    'div',
    { className: index_module_scss_1['default']['header-wrapper'] },
    React.createElement(
      'div',
      { className: index_module_scss_1['default'].header },
      React.createElement(
        'div',
        { className: index_module_scss_1['default'].left },
        React.createElement(
          antd_1.Space,
          null,
          React.createElement(
            antd_1.Button,
            {
              type: 'link',
              // 固定返回管理问卷列表，避免从模板登录中转链路进入时回到中转页
              onClick: function () {
                return navigate(
                  isTemplateMode
                    ? router_1.routePath.MANAGE_TEMPLATES
                    : router_1.routePath.MANAGE_LIST
                );
              },
              icon: React.createElement(icons_1.LeftOutlined, null),
            },
            '\u8FD4\u56DE'
          ),
          React.createElement(EditTitle_1['default'], null)
        )
      ),
      React.createElement(
        'div',
        { className: index_module_scss_1['default'].main },
        React.createElement(EditToolbar_1['default'], null)
      ),
      React.createElement(
        'div',
        { className: index_module_scss_1['default'].right },
        React.createElement(
          antd_1.Space,
          null,
          !isTemplateMode &&
            React.createElement(EditImportButton_1['default'], null),
          !isTemplateMode &&
            React.createElement(EditAIGenerateButton_1['default'], null),
          React.createElement(EditExportButton_1['default'], null),
          !isTemplateMode &&
            React.createElement(EditSaveAsTemplateButton_1['default'], null),
          React.createElement(EditSaveButton_1['default'], null),
          !isTemplateMode &&
            React.createElement(EditSubmitReviewButton_1['default'], null),
          !isTemplateMode &&
            React.createElement(EditPublishButton_1['default'], null)
        )
      )
    )
  );
};
exports['default'] = EditHeader;
