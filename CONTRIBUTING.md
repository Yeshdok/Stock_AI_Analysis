# 🤝 贡献指南

感谢您对A股量化分析系统的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题报告和功能建议。

## 🚀 快速开始

### 1. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮，将项目 fork 到您的账户下。

### 2. 克隆项目

```bash
git clone https://github.com/your-username/stock_analysis.git
cd stock_analysis
```

### 3. 设置开发环境

```bash
# 安装后端依赖
pip install -r requirements.txt

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 4. 配置 TuShare Token

```bash
# 复制配置文件模板
cp config/tushare_config_example.json config/tushare_config.json

# 编辑配置文件，添加您的 TuShare Token
```

### 5. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

## 📋 贡献类型

### 🐛 Bug 修复
- 在 Issues 中搜索是否已有相同问题
- 如果没有，请创建新的 Issue 详细描述问题
- 提供复现步骤和环境信息
- 在分支中修复问题并提交 PR

### ✨ 新功能开发
- 在 Issues 中提出功能建议
- 等待维护者确认功能的必要性
- 创建功能分支开始开发
- 确保新功能有相应的测试

### 📖 文档改进
- 修正文档中的错误
- 添加缺失的说明
- 改进代码注释
- 翻译文档到其他语言

### 🧪 测试增强
- 添加单元测试
- 改进集成测试
- 增加边界情况测试
- 提高测试覆盖率

## 📝 代码规范

### Python 代码规范

遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/) 代码风格：

```python
# 好的示例
def calculate_market_breadth(trade_date: str) -> Dict[str, Any]:
    """
    计算市场宽度指标
    
    Args:
        trade_date: 交易日期，格式为 YYYYMMDD
        
    Returns:
        包含市场宽度数据的字典
    """
    try:
        # 实现代码
        return result
    except Exception as e:
        logger.error(f"计算市场宽度失败: {e}")
        raise
```

### JavaScript 代码规范

使用 ESLint 和 Prettier 确保代码一致性：

```javascript
// 好的示例
const fetchMarketData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.get('/market-breadth');
    setData(response.data);
  } catch (error) {
    setError(error.message);
    console.error('获取市场数据失败:', error);
  } finally {
    setLoading(false);
  }
}, []);
```

### 命名规范

- **变量名**: 使用有意义的名称，避免缩写
- **函数名**: 动词开头，清晰表达功能
- **类名**: 使用 PascalCase
- **常量**: 使用 UPPER_SNAKE_CASE

```python
# 好的示例
class MarketAnalyzer:
    DEFAULT_TIMEOUT = 30
    
    def calculate_moving_average(self, prices: List[float], period: int) -> float:
        return sum(prices[-period:]) / period
```

## 🧪 测试要求

### 单元测试

每个新功能都应该有相应的测试：

```python
# tests/test_market_analyzer.py
import pytest
from src.market_analyzer import MarketAnalyzer

class TestMarketAnalyzer:
    def setup_method(self):
        self.analyzer = MarketAnalyzer()
    
    def test_calculate_moving_average(self):
        prices = [10, 12, 14, 16, 18]
        result = self.analyzer.calculate_moving_average(prices, 5)
        assert result == 14.0
    
    def test_calculate_moving_average_with_invalid_period(self):
        prices = [10, 12]
        with pytest.raises(ValueError):
            self.analyzer.calculate_moving_average(prices, 5)
```

### 前端测试

React 组件应该有相应的测试：

```javascript
// src/__tests__/MarketBreadth.test.js
import { render, screen, waitFor } from '@testing-library/react';
import MarketBreadth from '../pages/MarketBreadth';

test('renders market breadth analysis title', () => {
  render(<MarketBreadth />);
  const titleElement = screen.getByText(/市场宽度分析/i);
  expect(titleElement).toBeInTheDocument();
});

test('fetches and displays market data', async () => {
  render(<MarketBreadth />);
  
  await waitFor(() => {
    expect(screen.getByText(/上涨股票/i)).toBeInTheDocument();
  });
});
```

### 运行测试

```bash
# Python 测试
pytest tests/

# 前端测试
cd frontend
npm test
```

## 📤 提交规范

### Commit 消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

#### 类型说明

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例

```
feat(market-analysis): 添加市场宽度分析功能

- 实现涨跌家数统计
- 添加成交量分布分析
- 集成 TuShare Pro API

Closes #123
```

### Pull Request 指南

1. **详细描述**: 清晰描述变更内容和原因
2. **关联 Issue**: 在 PR 描述中引用相关 Issue
3. **测试覆盖**: 确保新代码有测试覆盖
4. **文档更新**: 如需要，更新相关文档
5. **代码审查**: 积极回应代码审查意见

#### PR 模板

```markdown
## 📋 变更描述

简要描述此 PR 的内容...

## 🔗 相关 Issue

Fixes #123
Related to #456

## 🧪 测试

- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 手动测试通过

## 📖 文档

- [ ] 更新了 README
- [ ] 更新了 API 文档
- [ ] 添加了代码注释

## ✅ 检查清单

- [ ] 代码通过 lint 检查
- [ ] 所有测试通过
- [ ] 代码遵循项目规范
- [ ] PR 标题符合规范
```

## 🔍 代码审查

### 审查要点

1. **功能正确性**: 代码是否实现了预期功能
2. **性能影响**: 是否有性能问题
3. **安全考虑**: 是否存在安全漏洞
4. **可维护性**: 代码是否清晰易懂
5. **测试充分性**: 测试是否覆盖主要场景

### 审查者指南

- 提供建设性的反馈
- 解释问题的原因和建议
- 认可好的实现方式
- 保持友善和专业的态度

### 被审查者指南

- 积极回应审查意见
- 解释设计决策的原因
- 虚心接受建议
- 及时修改问题代码

## 🐛 问题报告

### Bug 报告模板

```markdown
## 🐛 Bug 描述

清晰简洁地描述问题...

## 🔄 复现步骤

1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 🎯 期望行为

描述您期望发生的情况...

## 📸 截图

如果适用，添加截图帮助解释问题...

## 🖥️ 环境信息

- OS: [例如 Windows 10, macOS 12.0]
- Browser: [例如 Chrome 95.0, Safari 15.0]
- Python Version: [例如 3.9.7]
- Node.js Version: [例如 16.13.0]

## 📝 额外信息

添加关于问题的任何其他上下文...
```

## 💡 功能建议

### 功能请求模板

```markdown
## 🚀 功能描述

清晰简洁地描述您想要的功能...

## 🎯 问题解决

描述此功能解决的问题...

## 💭 解决方案

描述您想要的解决方案...

## 🔄 替代方案

描述您考虑过的替代解决方案...

## 📝 额外信息

添加关于功能请求的任何其他上下文或截图...
```

## 🏆 贡献者认可

我们使用 [All Contributors](https://allcontributors.org/) 规范来认可贡献者：

- **代码贡献**: 💻
- **文档贡献**: 📖
- **Bug 报告**: 🐛
- **想法建议**: 🤔
- **问题解答**: 💬
- **测试**: 🧪
- **设计**: 🎨

## 📞 获取帮助

如果您有任何问题，可以通过以下方式获取帮助：

1. **GitHub Issues**: 报告 Bug 或提出功能建议
2. **GitHub Discussions**: 一般性问题和讨论
3. **邮件联系**: [your-email@example.com]

## 📄 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与此项目即表示您同意遵守其条款。

---

感谢您的贡献！🎉 每一个贡献都让这个项目变得更好。