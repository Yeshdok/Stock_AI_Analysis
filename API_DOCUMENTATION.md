# 📡 A股量化分析系统 API 文档

## 📋 接口概览

| 接口 | 方法 | 路径 | 功能描述 |
|------|------|------|----------|
| 健康检查 | GET | `/api/health` | 检查服务状态 |
| 股票技术分析 | GET | `/api/trading-signals/<code>` | 获取单只股票技术指标 |
| 市场概览 | POST | `/api/market-overview` | 获取市场整体数据 |
| 涨停分析 | POST | `/api/limit-up-analysis` | 涨停股统计和分析 |
| 市场宽度分析 | POST/GET | `/api/market-breadth` | 市场宽度指标分析 |
| 策略执行 | POST | `/api/strategies/execute` | 执行股票筛选策略 |
| 策略列表 | GET | `/api/strategies/list` | 获取可用策略列表 |

## 🔧 接口详情

### 1. 健康检查

**接口地址**: `GET /api/health`

**功能**: 检查API服务状态

**请求参数**: 无

**响应示例**:
```json
{
  "status": "ok",
  "message": "API服务正常运行",
  "timestamp": "2023-12-01T10:00:00Z",
  "version": "1.0.0"
}
```

### 2. 股票技术分析

**接口地址**: `GET /api/trading-signals/<stock_code>`

**功能**: 获取指定股票的技术分析数据

**路径参数**:
- `stock_code`: 股票代码 (如: 000001.SZ, 600519.SH)

**查询参数**:
- `period`: 分析周期，可选值: `1d`(日线), `1w`(周线), `1m`(月线)，默认 `1d`
- `limit`: 返回数据条数，默认 `60`

**请求示例**:
```http
GET /api/trading-signals/000001.SZ?period=1d&limit=60
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "stock_code": "000001.SZ",
    "stock_name": "平安银行",
    "current_price": 12.50,
    "price_change": 0.15,
    "price_change_percent": 1.21,
    "technical_indicators": {
      "ma5": 12.35,
      "ma10": 12.20,
      "ma20": 12.10,
      "macd": {
        "dif": 0.05,
        "dea": 0.03,
        "macd": 0.04
      },
      "rsi": 55.6,
      "kdj": {
        "k": 68.5,
        "d": 65.2,
        "j": 75.1
      }
    },
    "trading_signals": [
      {
        "signal_type": "buy",
        "signal_strength": "strong",
        "reason": "MACD金叉",
        "timestamp": "2023-12-01T09:30:00Z"
      }
    ],
    "kline_data": [
      {
        "date": "2023-12-01",
        "open": 12.40,
        "high": 12.55,
        "low": 12.35,
        "close": 12.50,
        "volume": 15000000
      }
    ]
  }
}
```

### 3. 市场概览

**接口地址**: `POST /api/market-overview`

**功能**: 获取A股市场整体概览数据

**请求参数**:
```json
{
  "trade_date": "20231201"  // 可选，默认最新交易日
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "trade_date": "20231201",
    "market_summary": {
      "total_stocks": 5000,
      "trading_stocks": 4850,
      "suspended_stocks": 150
    },
    "index_data": {
      "sh_composite": {
        "code": "000001.SH",
        "name": "上证指数",
        "close": 3100.50,
        "change": 15.20,
        "change_percent": 0.49
      },
      "sz_component": {
        "code": "399001.SZ",
        "name": "深证成指",
        "close": 10500.30,
        "change": -8.50,
        "change_percent": -0.08
      }
    },
    "market_sentiment": {
      "up_count": 2500,
      "down_count": 2200,
      "flat_count": 150,
      "limit_up_count": 45,
      "limit_down_count": 8
    }
  }
}
```

### 4. 涨停分析

**接口地址**: `POST /api/limit-up-analysis`

**功能**: 分析涨停股票的分布和特征

**请求参数**:
```json
{
  "trade_date": "20231201",  // 可选，默认最新交易日
  "analysis_type": "daily"   // 分析类型: daily, weekly, monthly
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "trade_date": "20231201",
    "summary": {
      "total_limit_up": 45,
      "first_limit_up": 38,
      "continuous_limit_up": 7,
      "next_day_success_rate": 65.8
    },
    "time_distribution": [
      {
        "time_range": "09:30-10:00",
        "count": 15,
        "percentage": 33.3
      },
      {
        "time_range": "10:00-10:30",
        "count": 12,
        "percentage": 26.7
      }
    ],
    "industry_distribution": [
      {
        "industry": "电子",
        "count": 8,
        "percentage": 17.8
      },
      {
        "industry": "计算机",
        "count": 6,
        "percentage": 13.3
      }
    ],
    "stock_list": [
      {
        "stock_code": "300001.SZ",
        "stock_name": "特锐德",
        "limit_up_time": "09:35:00",
        "is_first_limit_up": true,
        "reason": "新能源概念",
        "next_day_prediction": "继续上涨概率70%"
      }
    ]
  }
}
```

### 5. 市场宽度分析

**接口地址**: `POST/GET /api/market-breadth`

**功能**: 计算和分析A股市场宽度指标

**请求参数** (POST方法):
```json
{
  "trade_date": "20231201",    // 可选，默认最新交易日
  "include_st": false,         // 是否包含ST股票
  "min_price": 1.0,           // 最低价格过滤
  "min_volume": 1000000       // 最低成交量过滤
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "trade_date": "20231201",
    "total_stocks": 5000,
    "data_source": "TuShare Pro深度API + AkShare (100%真实数据)",
    "data_quality": "96.8%",
    "up_down_analysis": {
      "up_count": 1061,
      "down_count": 4287,
      "flat_count": 61,
      "total_count": 5409,
      "up_ratio": 19.6,
      "down_ratio": 79.3,
      "advance_decline_ratio": 0.25
    },
    "limit_analysis": {
      "limit_up_count": 68,
      "limit_down_count": 19,
      "limit_up_ratio": 1.26,
      "limit_down_ratio": 0.35
    },
    "price_change_distribution": [
      {
        "range": "涨停(>9.5%)",
        "count": 68,
        "percentage": 1.26
      },
      {
        "range": "大涨(5%-9.5%)",
        "count": 156,
        "percentage": 2.88
      }
    ],
    "volume_distribution": [
      {
        "range": "超大量(>10亿)",
        "count": 25,
        "percentage": 0.46
      },
      {
        "range": "大量(1-10亿)",
        "count": 348,
        "percentage": 6.43
      }
    ],
    "market_cap_distribution": [
      {
        "range": "超大盘(>1000亿)",
        "count": 89,
        "percentage": 1.65
      },
      {
        "range": "大盘股(100-1000亿)",
        "count": 567,
        "percentage": 10.48
      }
    ],
    "market_activity": {
      "active_stocks": 3245,
      "active_ratio": 60.0,
      "high_turnover_stocks": 456,
      "high_turnover_ratio": 8.4,
      "avg_turnover_rate": 2.3,
      "avg_volume_ratio": 1.05
    }
  }
}
```

### 6. 策略执行

**接口地址**: `POST /api/strategies/execute`

**功能**: 根据指定条件执行股票筛选策略

**请求参数**:
```json
{
  "strategy_name": "value_investment",  // 策略名称
  "filters": {
    "pe_min": 5,                       // 最小PE
    "pe_max": 30,                      // 最大PE
    "pb_min": 0.5,                     // 最小PB
    "pb_max": 5,                       // 最大PB
    "roe_min": 8,                      // 最小ROE(%)
    "market_cap_min": 50,              // 最小市值(亿)
    "market_cap_max": 3000,            // 最大市值(亿)
    "industries": ["银行", "保险"],      // 行业筛选
    "exclude_st": true                 // 排除ST股票
  },
  "sort_by": "pe",                     // 排序字段
  "sort_order": "asc",                 // 排序方向: asc, desc
  "limit": 50                          // 返回数量限制
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "execution_id": "exec_20231201_001",
    "strategy_name": "value_investment",
    "execution_time": "2023-12-01T10:30:00Z",
    "total_filtered": 150,
    "qualified_count": 42,
    "data_source": "TuShare Pro + AkShare",
    "results": [
      {
        "stock_code": "601398.SH",
        "stock_name": "工商银行",
        "current_price": 5.20,
        "pe": 4.8,
        "pb": 0.65,
        "roe": 13.5,
        "market_cap": 18500,
        "industry": "银行",
        "strategy_score": 95,
        "investment_style": "价值投资",
        "risk_level": "低",
        "recommendation": "强烈推荐"
      }
    ],
    "statistics": {
      "avg_pe": 12.5,
      "avg_pb": 1.8,
      "avg_roe": 15.2,
      "industry_distribution": {
        "银行": 25,
        "保险": 17
      }
    }
  }
}
```

### 7. 策略列表

**接口地址**: `GET /api/strategies/list`

**功能**: 获取所有可用的筛选策略

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "strategies": [
      {
        "strategy_id": "value_investment",
        "strategy_name": "价值投资策略",
        "description": "基于PE、PB、ROE等指标筛选低估值股票",
        "parameters": {
          "pe_range": [3, 30],
          "pb_range": [0.3, 5],
          "roe_min": 8
        },
        "risk_level": "低",
        "expected_return": "稳健"
      },
      {
        "strategy_id": "growth_investment",
        "strategy_name": "成长投资策略",
        "description": "筛选高成长性股票",
        "parameters": {
          "revenue_growth_min": 20,
          "profit_growth_min": 15,
          "pe_max": 50
        },
        "risk_level": "中",
        "expected_return": "较高"
      }
    ]
  }
}
```

## 🔐 认证和权限

当前版本暂不需要认证，后续版本将支持API Key认证。

## 📊 响应状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 接口不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务暂不可用 |

## 🚀 使用示例

### Python 示例

```python
import requests

# 获取市场宽度分析
def get_market_breadth():
    url = "http://localhost:5001/api/market-breadth"
    response = requests.post(url, json={})
    
    if response.status_code == 200:
        data = response.json()
        print(f"上涨股票: {data['data']['up_down_analysis']['up_count']}只")
        print(f"下跌股票: {data['data']['up_down_analysis']['down_count']}只")
    else:
        print(f"请求失败: {response.status_code}")

# 获取股票技术分析
def get_stock_analysis(stock_code):
    url = f"http://localhost:5001/api/trading-signals/{stock_code}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print(f"股票: {data['data']['stock_name']}")
        print(f"当前价格: {data['data']['current_price']}")
        print(f"涨跌幅: {data['data']['price_change_percent']}%")
    else:
        print(f"请求失败: {response.status_code}")

# 使用示例
get_market_breadth()
get_stock_analysis("000001.SZ")
```

### JavaScript 示例

```javascript
// 获取市场宽度分析
async function getMarketBreadth() {
  try {
    const response = await fetch('http://localhost:5001/api/market-breadth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    console.log('上涨股票:', data.data.up_down_analysis.up_count);
    console.log('下跌股票:', data.data.up_down_analysis.down_count);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 获取股票技术分析
async function getStockAnalysis(stockCode) {
  try {
    const response = await fetch(`http://localhost:5001/api/trading-signals/${stockCode}`);
    const data = await response.json();
    
    console.log('股票:', data.data.stock_name);
    console.log('当前价格:', data.data.current_price);
    console.log('涨跌幅:', data.data.price_change_percent + '%');
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 使用示例
getMarketBreadth();
getStockAnalysis('000001.SZ');
```

## 📋 注意事项

1. **数据更新频率**: 实时数据每15分钟更新一次，日线数据在收盘后更新
2. **请求频率限制**: 建议每秒不超过10次请求，避免API被限制
3. **数据质量**: 所有数据均来自TuShare Pro和AkShare真实数据源
4. **时区**: 所有时间戳均为北京时间(UTC+8)
5. **股票代码格式**: 使用标准格式，如000001.SZ(深交所)、600519.SH(上交所)

## 🔄 版本更新

当前版本: v1.0.0

更新日志详见项目的 CHANGELOG.md 文件。