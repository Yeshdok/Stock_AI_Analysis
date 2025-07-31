# 🔧 故障排除指南

## 常见问题及解决方案

### 1. 端口占用问题

**问题描述：**
```
Address already in use
Port 8080 is in use by another program.
```

**解决方案：**

**方法一：更改端口号**
```python
# 在 src/app.py 中修改端口号
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8081)  # 改为其他端口
```

**方法二：停止占用端口的程序**
```bash
# Linux/macOS
# 查找占用端口的进程
lsof -i :8080
# 或
ss -tlnp | grep :8080

# 杀掉进程（替换 PID 为实际进程ID）
kill -9 PID

# Windows
# 查找占用端口的进程
netstat -ano | findstr :8080
# 杀掉进程（替换 PID 为实际进程ID）
taskkill /PID PID /F
```

### 2. 模板文件找不到

**问题描述：**
```
jinja2.exceptions.TemplateNotFound: index.html
```

**解决方案：**
1. 确认文件结构正确：
```
项目根目录/
├── src/
│   └── app.py
└── static/
    └── templates/
        └── index.html
```

2. 检查 Flask 应用的模板路径设置：
```python
# 在 src/app.py 中确认路径设置
template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'templates')
app = Flask(__name__, template_folder=template_dir)
```

### 3. 依赖包安装失败

**问题描述：**
```
ModuleNotFoundError: No module named 'akshare'
```

**解决方案：**
```bash
# 确认环境已激活
conda activate stock_analysis

# 重新安装依赖
pip install -r config/requirements.txt

# 或单独安装问题包
pip install akshare
```

### 4. 数据获取失败

**问题描述：**
```
未能获取到股票 000001 的数据
```

**解决方案：**
1. 检查网络连接
2. 确认股票代码正确（6位数字）
3. 尝试其他股票代码
4. 检查 akshare 包是否为最新版本：
```bash
pip install --upgrade akshare
```

### 5. 在 Cursor 中测试网页

**方法一：使用内置测试脚本**
```python
# 创建 test_web.py
import requests
import time

def test_web_app():
    url = "http://localhost:8080"
    time.sleep(3)  # 等待应用启动
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print("✅ 网页正常运行")
            if "股票分析系统" in response.text:
                print("✅ 页面内容正确")
            else:
                print("⚠️ 页面内容可能有问题")
        else:
            print(f"❌ 错误状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")

if __name__ == "__main__":
    test_web_app()
```

**方法二：使用 curl 命令**
```bash
# 安装 curl（如果未安装）
sudo apt install curl  # Ubuntu/Debian
# 或
sudo yum install curl   # CentOS/RHEL

# 测试网页
curl -I http://localhost:8080
```

### 6. 环境相关问题

**问题：conda 命令未找到**
```bash
# 初始化 conda
source ~/anaconda3/etc/profile.d/conda.sh
# 或
source ~/miniconda3/etc/profile.d/conda.sh
```

**问题：环境激活失败**
```bash
# 手动激活环境
source activate stock_analysis
# 或
conda activate stock_analysis
```

### 7. 权限问题

**Linux/macOS 权限问题：**
```bash
# 给启动脚本执行权限
chmod +x scripts/start.sh

# 如果端口需要管理员权限（端口 < 1024）
sudo python src/app.py
```

### 8. 性能优化

**问题：应用启动慢**
- 使用 conda 环境可以提高包加载速度
- 确保系统有足够的内存（推荐 4GB+）
- 关闭不必要的后台程序

**问题：数据获取慢**
- 选择较短的时间范围
- 检查网络连接速度
- 考虑使用缓存机制

## 🔍 调试技巧

### 1. 启用详细日志
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 2. 检查应用状态
```bash
# 检查端口占用
ss -tlnp | grep :8080

# 检查进程
ps aux | grep python
```

### 3. 验证环境
```python
# 在 Python 中验证包安装
import sys
print(sys.path)

import akshare as ak
import pandas as pd
import plotly
print("所有包导入成功")
```

## 📞 获取帮助

如果以上解决方案都无法解决问题，请：

1. 检查项目的 GitHub Issues
2. 提供详细的错误信息和系统环境
3. 包含完整的错误堆栈跟踪

## 🔄 重置环境

如果问题严重，可以重置整个环境：

```bash
# 删除现有环境
conda env remove -n stock_analysis

# 重新创建环境
conda create -n stock_analysis python=3.10 -y
conda activate stock_analysis

# 重新安装依赖
pip install -r config/requirements.txt

# 重新运行程序
python run.py
``` 