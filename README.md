# 📊 A股量化分析系统

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-000000.svg)](https://flask.palletsprojects.com)
[![TuShare](https://img.shields.io/badge/TuShare-Pro-FF6B6B.svg)](https://tushare.pro)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🚀 基于TuShare Pro + AkShare深度API的专业A股量化分析系统，提供实时市场数据分析、涨停股追踪、技术指标计算和智能交易信号生成。

## ✨ 核心功能

### 📈 涨停股分析
- **首次涨停追踪**: 识别每日首次涨停股票，分析次日连板概率
- **涨停时间分布**: 统计涨停股票的时间分布规律，发现市场热点
- **连板成功率**: 基于历史数据计算连板成功率和风险评估
- **真实数据保障**: 100%基于TuShare Pro深度API真实数据

### 🌊 市场宽度分析
- **涨跌家数统计**: 实时统计上涨、下跌、平盘股票数量和比例
- **涨停跌停监控**: 精确识别涨停跌停股票，支持不同板块涨跌幅限制
- **成交量分布**: 分析市场成交量分布情况，评估市场活跃度
- **市值分布**: 按市值区间分析股票分布，洞察资金偏好
- **市场活跃度**: 计算换手率、成交量等活跃度指标

### 📊 技术分析系统
- **多维K线图表**: 支持日线、周线、月线等多时间周期
- **技术指标**: MA、MACD、KDJ、RSI、BOLL等主流技术指标
- **筹码分布**: 基于成交量和价格计算筹码分布，识别支撑阻力位
- **交易信号**: 自动识别金叉死叉、突破信号等交易机会

### 🎯 智能策略系统
- **多策略支持**: 价值投资、成长股、高股息、动量等多种策略
- **条件筛选**: 支持PE、PB、ROE、市值等多维度筛选条件
- **实时评分**: 基于彼得林奇等经典投资理论的股票评分系统
- **风险控制**: 内置风险评估和仓位管理建议

### 🔍 智能搜索
- **多方式搜索**: 支持股票代码、公司名称、拼音缩写搜索
- **行业分类**: 自动识别银行、科技、医药等行业分类
- **搜索历史**: 本地存储搜索历史，提升用户体验

## 🛠 技术架构

### 后端技术栈
- **核心框架**: Python 3.8+ / Flask 2.0+
- **数据源**: TuShare Pro API + AkShare
- **数据处理**: Pandas + NumPy
- **API文档**: RESTful API设计
- **并发控制**: 处理锁机制防止API冲突

### 前端技术栈
- **UI框架**: React 18.0+ / Material-UI 5.0+
- **图表库**: Recharts + Lightweight Charts
- **状态管理**: React Hooks
- **HTTP客户端**: Axios
- **响应式设计**: 支持桌面端和移动端

### 数据源说明
- **TuShare Pro**: 提供A股基础数据、财务数据、行情数据
- **AkShare**: 作为备用数据源，提供实时行情补充
- **数据质量**: 100%真实数据，支持历史数据回测

## 🚀 快速开始

### 环境要求

- **Python**: 3.8 或更高版本
- **Node.js**: 14.0 或更高版本
- **npm**: 6.0 或更高版本
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

### 1. 克隆项目

```bash
git clone https://github.com/your-username/stock_analysis.git
cd stock_analysis
```

### 2. 后端环境配置

#### 安装Python依赖
```bash
pip install -r requirements.txt
```

#### 配置TuShare Token
1. 注册 [TuShare Pro](https://tushare.pro) 账号获取Token
2. 创建配置文件：

```bash
mkdir config
```

创建 `config/tushare_config.json` 文件：
```json
{
  "token": "your_tushare_token_here"
}
```

#### 验证后端环境
```bash
python src/trading_signals_fast.py
```

成功启动后应显示：
```
✅ TuShare Pro API初始化成功
✅ AkShare API连接成功
🚀 服务地址: http://127.0.0.1:5001
```

### 3. 前端环境配置

#### 安装前端依赖
```bash
cd frontend
npm install
```

#### 启动前端服务
```bash
npm start
```

成功启动后应显示：
```
Compiled successfully!
Local:            http://localhost:3000
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 📋 部署指南

### 开发环境部署

#### Windows 环境
1. **启动后端**：
   ```powershell
   python src\trading_signals_fast.py
   ```

2. **启动前端**：
   ```powershell
   cd frontend
   npm start
   ```

#### Linux/macOS 环境
1. **启动后端**：
   ```bash
   python src/trading_signals_fast.py
   ```

2. **启动前端**：
   ```bash
   cd frontend
   npm start
   ```

### 生产环境部署

#### 后端生产部署
```bash
# 使用 Gunicorn (推荐)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 src.trading_signals_fast:app

# 或使用 uWSGI
pip install uwsgi
uwsgi --http :5001 --wsgi-file src/trading_signals_fast.py --callable app
```

#### 前端生产部署
```bash
cd frontend
npm run build

# 使用 Nginx 或其他静态文件服务器托管 build 目录
```

#### Docker 部署 (可选)
```dockerfile
# Dockerfile.backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "src/trading_signals_fast.py"]
```

```dockerfile
# Dockerfile.frontend
FROM node:16-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 配置说明

### API端点列表

| 端点 | 方法 | 功能 | 说明 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | 检查服务状态 |
| `/api/trading-signals/<code>` | GET | 股票技术分析 | 获取单只股票技术指标 |
| `/api/market-overview` | POST | 市场概览 | 获取市场整体数据 |
| `/api/limit-up-analysis` | POST | 涨停分析 | 涨停股统计和分析 |
| `/api/market-breadth` | POST/GET | 市场宽度 | 市场宽度指标分析 |
| `/api/strategies/execute` | POST | 策略执行 | 执行股票筛选策略 |
| `/api/strategies/list` | GET | 策略列表 | 获取可用策略列表 |

### 环境变量配置

创建 `.env` 文件（可选）：
```env
FLASK_ENV=development
TUSHARE_TOKEN=your_token_here
API_PORT=5001
FRONTEND_PORT=3000
```

### 数据更新频率

- **实时数据**: 每15分钟更新一次
- **日线数据**: 每日收盘后更新
- **基本面数据**: 每周更新
- **财务数据**: 每季度更新

## 📊 功能演示

### 市场宽度分析界面
- 📈 **涨跌家数**: 直观显示市场情绪
- 🔴 **涨停跌停**: 实时统计极端价格股票
- 📊 **可视化图表**: 成交量分布、市值分布饼图和柱状图
- 🎨 **专业UI**: 涨红跌绿配色，符合中国股市习惯

### 涨停股分析
- 📅 **每日统计**: 首次涨停股票识别
- ⏰ **时间分布**: 涨停时间段统计
- 📈 **连板分析**: 次日连板概率计算
- 🎯 **投资建议**: 基于历史数据的投资建议

### 技术分析系统
- 📊 **K线图表**: 专业级交易图表
- 📈 **技术指标**: 20+主流技术指标
- 🎯 **交易信号**: 自动买入卖出点标记
- 📋 **数据面板**: 实时价格和指标数据

## 🔍 故障排除

### 常见问题

#### 1. 后端启动失败
```bash
# 检查Python版本
python --version

# 检查依赖安装
pip list | grep flask
pip list | grep pandas

# 重新安装依赖
pip install -r requirements.txt
```

#### 2. TuShare连接失败
- 检查Token是否正确配置
- 确认网络连接正常
- 验证TuShare Pro账号状态

#### 3. 前端编译错误
```bash
# 清理缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version
```

#### 4. 端口占用问题
```bash
# Windows 检查端口占用
netstat -an | findstr :5001
netstat -an | findstr :3000

# Linux/macOS 检查端口占用
lsof -i :5001
lsof -i :3000
```

### 性能优化建议

1. **后端优化**：
   - 使用Redis缓存热点数据
   - 实施API请求频率限制
   - 优化数据库查询

2. **前端优化**：
   - 启用代码分割 (Code Splitting)
   - 使用React.memo优化组件渲染
   - 实施虚拟滚动处理大数据集

## 🤝 贡献指南

### 开发规范

1. **代码风格**：
   - Python: PEP 8 标准
   - JavaScript: ESLint + Prettier
   - 提交前运行代码检查

2. **提交规范**：
   ```
   feat: 新功能
   fix: 修复问题
   docs: 文档更新
   style: 代码格式调整
   refactor: 代码重构
   test: 测试相关
   ```

3. **开发流程**：
   - Fork 项目到个人仓库
   - 创建功能分支
   - 提交Pull Request
   - 代码审查通过后合并

### 功能建议

欢迎提交以下类型的贡献：
- 🆕 新的技术指标算法
- 📊 更多可视化图表类型
- 🔍 增强的搜索功能
- 📱 移动端适配优化
- 🌐 国际化支持

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [TuShare Pro](https://tushare.pro) - 提供专业的金融数据API
- [AkShare](https://github.com/akfamily/akshare) - 开源金融数据接口库
- [Material-UI](https://mui.com) - React UI 组件库
- [Recharts](https://recharts.org) - React 图表库

## 📞 联系方式

- **项目地址**: [GitHub Repository](https://github.com/your-username/stock_analysis)
- **问题反馈**: [Issues](https://github.com/your-username/stock_analysis/issues)
- **功能建议**: [Discussions](https://github.com/your-username/stock_analysis/discussions)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！ ⭐**

Made with ❤️ by [Your Name]

</div>
