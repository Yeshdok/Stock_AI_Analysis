# 股票分析系统前端

基于 React 和 Material-UI 构建的现代化股票分析系统前端界面。

## 功能特性

- 🎨 **现代化UI设计**：基于 Material-UI 的响应式设计
- 🔍 **智能股票搜索**：支持股票代码、公司名称、拼音搜索
- 📊 **交易信号分析**：实时显示买卖信号和技术指标
- 📈 **交互式图表**：支持缩放、拖拽的图表显示
- 📱 **移动端适配**：完美支持手机和桌面设备
- ⚡ **快速响应**：优化的性能和用户体验

## 技术栈

- **React 18** - 前端框架
- **Material-UI 5** - UI组件库
- **Axios** - HTTP客户端
- **React Hooks** - 状态管理

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── public/                 # 静态资源
│   └── index.html         # HTML模板
├── src/                   # 源代码
│   ├── components/        # 组件
│   │   ├── StockSearch.js      # 股票搜索组件
│   │   ├── TradingSignals.js   # 交易信号组件
│   │   ├── DetailedAnalysis.js # 详细分析组件
│   │   └── ChartDisplay.js     # 图表显示组件
│   ├── pages/             # 页面
│   │   └── HomePage.js    # 主页面
│   ├── utils/             # 工具函数
│   │   └── api.js         # API服务
│   ├── App.js             # 应用主组件
│   ├── index.js           # 入口文件
│   └── theme.js           # 主题配置
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 组件说明

### StockSearch
智能股票搜索组件，支持：
- 股票代码搜索
- 公司名称搜索
- 拼音缩写搜索
- 实时联想补全

### TradingSignals
交易信号分析组件，显示：
- 买卖信号类型
- 信号强度
- 技术指标数据
- 风险提示

### DetailedAnalysis
详细分析组件，包含：
- MACD分析
- RSI分析
- 布林带分析
- 移动平均线分析
- 成交量分析
- 筹码分布分析

### ChartDisplay
图表显示组件，支持：
- 交互式技术指标图表
- 加载状态显示
- 错误处理

## API 配置

前端通过 `src/utils/api.js` 与后端通信，支持：

- 股票搜索：`GET /search_stocks`
- 股票信息：`GET /get_stock_info`
- 交易信号：`POST /trading_signals`
- 图表获取：`GET /chart/{filename}`

## 主题定制

主题配置位于 `src/theme.js`，支持：

- 自定义颜色方案
- 字体配置
- 组件样式覆盖
- 响应式断点

## 开发说明

### 环境变量

创建 `.env` 文件配置环境变量：

```
REACT_APP_API_URL=http://localhost:5000
```

### 代理配置

开发环境下，API请求会自动代理到后端服务器（配置在 package.json 中）。

### 构建部署

1. 构建生产版本：
```bash
npm run build
```

2. 部署到服务器：
```bash
# 将 build 目录部署到 Web 服务器
```

## 浏览器支持

- Chrome >= 60
- Firefox >= 60
- Safari >= 12
- Edge >= 79

## 许可证

MIT License 