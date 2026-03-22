/**
 * 主应用组件
 * 应用的入口点，目前直接渲染问卷列表页面
 */
import List from './pages/manage/List';

/**
 * App 组件
 * @returns 应用的主界面，包含标题和问卷列表
 */
function App() {
  return (
    <div className="App">
      {/* 应用标题 */}
      <h1>问卷 FE</h1>
      {/* 问卷列表组件 */}
      <List />
    </div>
  );
}

export default App;
