"""
数据获取器 - 结合akshare和tushare的真实数据获取
支持多种数据源，确保数据的真实性和完整性
"""

import tushare as ts
import akshare as ak
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import json
import os
from typing import Optional, Tuple, Dict, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class OptimizedDataFetcher:
    """
    优化的数据获取器 - 解决超时和连接问题
    """
    
    def __init__(self):
        # 初始化tushare
        self.tushare_available = False
        self.akshare_available = False
        
        # 配置连接池和重试策略
        self.session = requests.Session()
        
        # 配置重试策略
        retry_strategy = Retry(
            total=3,  # 总重试次数
            backoff_factor=1,  # 重试间隔倍数
            status_forcelist=[429, 500, 502, 503, 504],  # 需要重试的HTTP状态码
            allowed_methods=["HEAD", "GET", "POST"]  # 允许重试的方法
        )
        
        # 配置HTTP适配器
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=20,  # 连接池大小
            pool_maxsize=20,
            pool_block=True
        )
        
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # 设置超时
        self.timeout = (10, 30)  # (连接超时, 读取超时)
        
        # 初始化API连接
        self._initialize_apis()
        
        print(f"📊 数据源状态: TuShare={self.tushare_available}, AkShare={self.akshare_available}")

    def _initialize_apis(self):
        """初始化所有API连接"""
        self._init_tushare()
        self._init_akshare()
    
    def _init_tushare(self):
        """初始化TuShare"""
        try:
            # 修复配置文件路径问题
            import os
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(project_root, 'config', 'tushare_config.json')
            
            print(f"🔍 查找TuShare配置文件: {config_path}")
            print(f"📁 配置文件是否存在: {os.path.exists(config_path)}")
            
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    token = config.get('token')
                    print(f"🔑 读取到Token: {token[:20]}...{token[-10:] if len(token) > 30 else ''}")
                    
                    if token:
                        ts.set_token(token)
                        self.pro = ts.pro_api()
                        self.tushare_pro = self.pro  # 添加别名确保兼容性
                        # 测试连接
                        print("🧪 测试TuShare连接...")
                        test_data = self.pro.query('stock_basic', exchange='', list_status='L', limit=1)
                        if test_data is not None and len(test_data) > 0:
                            self.tushare_available = True
                            print("✅ TuShare Pro API初始化成功")
                        else:
                            print("⚠️ TuShare Pro API测试失败")
            else:
                print("⚠️ TuShare配置文件不存在")
            
            if not self.tushare_available:
                print("⚠️ TuShare Pro未正确配置")
                
        except Exception as e:
            print(f"❌ TuShare初始化失败: {e}")
            self.tushare_available = False
    
    def _init_akshare(self):
        """初始化AkShare - 修复连接问题"""
        try:
            import socket
            import requests
            
            # 设置更长的socket超时
            old_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(30)  # 30秒超时
            
            # 配置AkShare的requests会话
            try:
                # 设置自定义User-Agent避免被反爬虫
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                # 创建会话并配置
                session = requests.Session()
                session.headers.update(headers)
                
                # 配置连接池
                adapter = requests.adapters.HTTPAdapter(
                    pool_connections=10,
                    pool_maxsize=20,
                    max_retries=3
                )
                session.mount('http://', adapter)
                session.mount('https://', adapter)
                
                # 将会话应用到akshare（如果支持的话）
                try:
                    import akshare as ak
                    # 某些版本的akshare支持设置session
                    if hasattr(ak, 'set_session'):
                        ak.set_session(session)
                except:
                    pass
                
                print("🧪 测试AkShare连接（增强版）...")
                
                # 如果TuShare可用，减少AkShare重试次数，节省时间
                max_retries = 1 if self.tushare_available else 3
                
                # 使用重试机制测试连接
                for attempt in range(max_retries):
                    try:
                        print(f"📡 AkShare连接测试 (第{attempt+1}次)...")
                        
                        # 测试获取少量数据避免超时
                        test_data = ak.stock_zh_a_spot_em()
                        
                        if test_data is not None and len(test_data) > 0:
                            self.akshare_available = True
                            print(f"✅ AkShare初始化成功 (第{attempt+1}次尝试)")
                            break
                        else:
                            print(f"⚠️ AkShare返回空数据 (第{attempt+1}次)")
                            if attempt < max_retries - 1:
                                import time
                                time.sleep(2 ** attempt)  # 指数退避
                                
                    except requests.exceptions.ConnectionError as e:
                        print(f"⚠️ AkShare连接错误 (第{attempt+1}次): 网络连接问题")
                        if attempt < max_retries - 1:
                            import time
                            time.sleep(3)
                    except requests.exceptions.Timeout as e:
                        print(f"⚠️ AkShare超时 (第{attempt+1}次): 请求超时")
                        if attempt < max_retries - 1:
                            import time
                            time.sleep(2)
                    except Exception as e:
                        error_msg = str(e)
                        if len(error_msg) > 100:
                            error_msg = error_msg[:100] + "..."
                        print(f"⚠️ AkShare测试失败 (第{attempt+1}次): {error_msg}")
                        if attempt < max_retries - 1:
                            import time
                            time.sleep(2)
                
                if not self.akshare_available:
                    if self.tushare_available:
                        print("💡 AkShare初始化失败，但TuShare可用，系统将优先使用TuShare")
                    else:
                        print("❌ AkShare初始化失败：所有重试都失败")
                        print("📡 系统将主要依赖TuShare数据源")
                
            finally:
                # 恢复原始超时设置
                socket.setdefaulttimeout(old_timeout)
                
        except ImportError:
            print("⚠️ AkShare未安装")
            self.akshare_available = False
        except Exception as e:
            error_msg = str(e)
            if len(error_msg) > 100:
                error_msg = error_msg[:100] + "..."
            print(f"❌ AkShare初始化异常: {error_msg}")
            if self.tushare_available:
                print("💡 将优先使用TuShare作为主要数据源")
            else:
                print("📡 系统将继续使用TuShare作为主要数据源")
            self.akshare_available = False
    
    def get_real_stock_data(self, stock_code: str, freq: str = "daily", 
                          start_date: str = None, end_date: str = None,
                          max_retries: int = 3) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
        """
        获取真实股票数据 - 优化版本，增强容错能力
        :param stock_code: 股票代码
        :param freq: 数据频率
        :param start_date: 开始日期
        :param end_date: 结束日期
        :param max_retries: 最大重试次数
        :return: (数据DataFrame, 数据源)
        """
        print(f"🔄 正在获取{stock_code}的{freq}数据（100%真实数据）...")
        
        # 标准化股票代码
        if '.' not in stock_code:
            if stock_code.startswith('6'):
                stock_code_full = f"{stock_code}.SH"
            elif stock_code.startswith(('0', '3')):
                stock_code_full = f"{stock_code}.SZ"
            elif stock_code.startswith('8'):
                stock_code_full = f"{stock_code}.BJ"
            else:
                stock_code_full = f"{stock_code}.SZ"
        else:
            stock_code_full = stock_code
        
        # 设置默认日期
        if end_date is None:
            end_date = datetime.now().strftime('%Y%m%d')
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=365*2)).strftime('%Y%m%d')
        
        # 方法1：优先使用TuShare（更稳定）
        if self.tushare_available:
            for attempt in range(max_retries):
                try:
                    print(f"📊 尝试TuShare获取 (第{attempt+1}次)...")
                    
                    # 使用pro_bar接口获取前复权数据
                    data = ts.pro_bar(
                        ts_code=stock_code_full,
                        adj='qfq',  # 前复权
                        start_date=start_date,
                        end_date=end_date
                        # 注意：pro_bar接口不支持timeout参数
                    )
                    
                    if data is not None and len(data) > 0:
                        # 数据预处理
                        data = data.sort_values('trade_date').reset_index(drop=True)
                        
                        # 🔥 修复：统一数据格式，确保前端兼容性
                        data = self._standardize_data_format(data, 'tushare')
                        
                        # 数据质量验证
                        if self._validate_data_quality(data, stock_code):
                            print(f"✅ TuShare获取成功: {len(data)} 条记录")
                            return data, "tushare_daily"
                        else:
                            print(f"⚠️ TuShare数据质量验证失败")
                    else:
                        print(f"⚠️ TuShare返回空数据")
                
                except Exception as e:
                    print(f"TuShare获取失败 (第{attempt+1}次): {e}")
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # 指数退避
                    continue
        
        # 方法2：使用AkShare（如果TuShare失败）
        if self.akshare_available:
            for attempt in range(max_retries):
                try:
                    print(f"📊 尝试AkShare获取 (第{attempt+1}次)...")
                    
                    # 设置请求头避免被反爬虫
                    import requests
                    session = requests.Session()
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                    session.headers.update(headers)
                    
                    # 获取历史数据
                    stock_code_6 = stock_code_full.split('.')[0]
                    
                    # 转换日期格式 YYYYMMDD -> YYYY-MM-DD
                    start_date_formatted = f"{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}"
                    end_date_formatted = f"{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]}"
                    
                    # 使用akshare获取历史数据
                    data = ak.stock_zh_a_hist(
                        symbol=stock_code_6,
                        period="daily",
                        start_date=start_date_formatted,
                        end_date=end_date_formatted,
                        adjust="qfq"  # 前复权
                    )
                    
                    if data is not None and len(data) > 0:
                        # 重命名列名以匹配tushare格式
                        if '日期' in data.columns:
                            data = data.rename(columns={
                                '日期': 'trade_date',
                                '开盘': 'open',
                                '收盘': 'close',
                                '最高': 'high',
                                '最低': 'low',
                                '成交量': 'vol',
                                '成交额': 'amount'
                            })
                        
                        # 转换日期格式
                        if 'trade_date' in data.columns:
                            data['trade_date'] = pd.to_datetime(data['trade_date']).dt.strftime('%Y%m%d')
                        
                        # 数据预处理
                        data = data.sort_values('trade_date').reset_index(drop=True)
                        
                        # 🔥 修复：统一数据格式，确保前端兼容性
                        data = self._standardize_data_format(data, 'akshare')
                        
                        # 数据质量验证
                        if self._validate_data_quality(data, stock_code):
                            print(f"✅ AkShare获取成功: {len(data)} 条记录")
                            return data, "akshare_daily"
                        else:
                            print(f"⚠️ AkShare数据质量验证失败")
                    else:
                        print(f"⚠️ AkShare返回空数据")
                
                except requests.exceptions.ConnectionError as e:
                    print(f"❌ AkShare网络连接错误 (第{attempt+1}次): 连接被拒绝")
                    if attempt < max_retries - 1:
                        time.sleep(3)  # 网络错误等待更长时间
                        continue
                except requests.exceptions.Timeout as e:
                    print(f"❌ AkShare请求超时 (第{attempt+1}次): 请求超时")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                except Exception as e:
                    error_msg = str(e)
                    if 'RemoteDisconnected' in error_msg or 'Connection aborted' in error_msg:
                        print(f"❌ AkShare连接中断 (第{attempt+1}次): 远程服务器断开连接")
                    else:
                        print(f"❌ AkShare获取失败 (第{attempt+1}次): {error_msg[:100]}...")
                    
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # 指数退避
                        continue
        
        # 如果所有方法都失败，返回None而不是模拟数据
        print(f"❌ 所有数据源都无法获取{stock_code}的数据，跳过此股票")
        return None, None
    
    def _standardize_akshare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        标准化AkShare数据格式
        """
        # 列名映射
        column_mapping = {
            '日期': 'trade_date',
            'date': 'trade_date',
            '开盘': 'open',
            'open': 'open',
            '最高': 'high', 
            'high': 'high',
            '最低': 'low',
            'low': 'low',
            '收盘': 'close',
            'close': 'close',
            '成交量': 'vol',
            'volume': 'vol',
            '成交额': 'amount',
            'amount': 'amount'
        }
        
        # 重命名列
        for old_name, new_name in column_mapping.items():
            if old_name in data.columns:
                data = data.rename(columns={old_name: new_name})
        
        # 确保必要列存在
        required_columns = ['trade_date', 'open', 'high', 'low', 'close', 'vol']
        for col in required_columns:
            if col not in data.columns:
                if col == 'vol' and 'volume' in data.columns:
                    data[col] = data['volume']
                elif col == 'trade_date' and data.index.name == 'date':
                    data = data.reset_index()
                    data['trade_date'] = data['date']
        
        return data
    
    def _validate_data_quality(self, data: pd.DataFrame, stock_code: str) -> bool:
        """
        验证数据质量
        """
        try:
            if data is None or len(data) == 0:
                return False
            
            # 检查必要列
            required_columns = ['trade_date', 'open', 'high', 'low', 'close']
            for col in required_columns:
                if col not in data.columns:
                    print(f"❌ 缺少必要列: {col}")
                    return False
            
            # 检查数据完整性
            if data[required_columns].isnull().any().any():
                print(f"⚠️ 数据包含空值")
                return False
            
            # 检查OHLC逻辑
            ohlc_check = (
                (data['high'] >= data['open']) & 
                (data['high'] >= data['close']) & 
                (data['low'] <= data['open']) & 
                (data['low'] <= data['close']) &
                (data['high'] >= data['low'])
            ).all()
            
            if not ohlc_check:
                print(f"⚠️ OHLC数据逻辑错误")
                return False
            
            print(f"✅ 数据质量验证通过: {stock_code}")
            return True
            
        except Exception as e:
            print(f"❌ 数据质量验证异常: {e}")
            return False
    
    def get_stock_basic_info(self, stock_code: str) -> Optional[Dict[str, Any]]:
        """
        获取股票基本信息 - 优化版本
        """
        try:
            if self.tushare_available:
                # 使用TuShare获取基本信息
                basic_info = self.pro.stock_basic(
                    ts_code=stock_code if '.' in stock_code else f"{stock_code}.SH",
                    fields='ts_code,symbol,name,area,industry,market,list_date'
                )
                
                if basic_info is not None and len(basic_info) > 0:
                    return basic_info.iloc[0].to_dict()
            
            # 备用方案：从股票代码推断基本信息
            code_6 = stock_code[:6] if '.' in stock_code else stock_code
            
            if code_6.startswith('6'):
                market = '上海证券交易所'
                board = '主板' if not code_6.startswith('688') else '科创板'
            elif code_6.startswith('0'):
                market = '深圳证券交易所'
                board = '主板'
            elif code_6.startswith('3'):
                market = '深圳证券交易所'
                board = '创业板'
            else:
                market = '未知'
                board = '未知'
            
            return {
                'ts_code': stock_code,
                'symbol': code_6,
                'name': f'股票{code_6}',
                'market': market,
                'board': board,
                'industry': '未知',
                'area': '未知'
            }
            
        except Exception as e:
            print(f"获取{stock_code}基本信息失败: {e}")
            return None
    
    def get_stock_name(self, stock_code: str) -> str:
        """
        获取股票名称
        :param stock_code: 股票代码
        :return: 股票名称
        """
        try:
            # 构造完整代码
            if '.' not in stock_code:
                if stock_code.startswith('6'):
                    full_code = f"{stock_code}.SH"
                elif stock_code.startswith(('0', '3')):
                    full_code = f"{stock_code}.SZ"
                elif stock_code.startswith('8'):
                    full_code = f"{stock_code}.BJ"
                else:
                    full_code = f"{stock_code}.SZ"
            else:
                full_code = stock_code
            
            # 优先使用TuShare获取股票名称
            if self.tushare_available:
                try:
                    basic_info = self.pro.stock_basic(
                        ts_code=full_code,
                        fields='ts_code,name'
                    )
                    
                    if basic_info is not None and len(basic_info) > 0:
                        return basic_info.iloc[0]['name']
                except Exception as e:
                    print(f"TuShare获取股票名称失败: {e}")
            
            # 备用方案：使用AkShare获取股票名称
            if self.akshare_available:
                try:
                    # 使用AkShare的股票信息接口
                    code_6 = stock_code[:6] if '.' in stock_code else stock_code
                    stock_info = ak.stock_individual_info_em(symbol=code_6)
                    
                    if stock_info is not None and len(stock_info) > 0:
                        # 查找股票名称
                        for _, row in stock_info.iterrows():
                            if row.get('item') == '股票简称':
                                return str(row.get('value', f'股票{code_6}'))
                except Exception as e:
                    print(f"AkShare获取股票名称失败: {e}")
            
            # 最终备用方案：返回股票代码作为名称
            code_6 = stock_code[:6] if '.' in stock_code else stock_code
            return f"股票{code_6}"
            
        except Exception as e:
            print(f"获取股票名称失败: {e}")
            code_6 = stock_code[:6] if '.' in stock_code else stock_code
            return f"股票{code_6}"

    def _standardize_data_format(self, data: pd.DataFrame, source: str) -> pd.DataFrame:
        """
        统一不同数据源的数据格式，确保前端兼容性
        :param data: 原始数据
        :param source: 数据源类型 ('tushare' 或 'akshare')
        :return: 标准化的数据
        """
        try:
            if data is None or len(data) == 0:
                return data
            
            # 复制数据避免修改原始数据
            standardized_data = data.copy()
            
            if source == 'tushare':
                # TuShare数据格式标准化
                if 'trade_date' in standardized_data.columns:
                    # 转换日期格式为前端期望的格式
                    standardized_data['Date'] = pd.to_datetime(standardized_data['trade_date'], format='%Y%m%d')
                
                # 统一列名映射
                column_mapping = {
                    'open': 'Open',
                    'close': 'Close', 
                    'high': 'High',
                    'low': 'Low',
                    'vol': 'Volume',
                    'amount': 'Amount'
                }
                
                for old_col, new_col in column_mapping.items():
                    if old_col in standardized_data.columns:
                        standardized_data[new_col] = standardized_data[old_col]
            
            elif source == 'akshare':
                # AkShare数据格式标准化
                if 'trade_date' in standardized_data.columns:
                    # AkShare的trade_date可能已经是datetime格式
                    if standardized_data['trade_date'].dtype == 'object':
                        standardized_data['Date'] = pd.to_datetime(standardized_data['trade_date'])
                    else:
                        standardized_data['Date'] = standardized_data['trade_date']
                
                # AkShare的列名可能已经是标准格式，检查并映射
                if 'open' in standardized_data.columns and 'Open' not in standardized_data.columns:
                    standardized_data['Open'] = standardized_data['open']
                if 'close' in standardized_data.columns and 'Close' not in standardized_data.columns:
                    standardized_data['Close'] = standardized_data['close']
                if 'high' in standardized_data.columns and 'High' not in standardized_data.columns:
                    standardized_data['High'] = standardized_data['high']
                if 'low' in standardized_data.columns and 'Low' not in standardized_data.columns:
                    standardized_data['Low'] = standardized_data['low']
                if 'vol' in standardized_data.columns and 'Volume' not in standardized_data.columns:
                    standardized_data['Volume'] = standardized_data['vol']
            
            # 确保数值列的数据类型正确
            numeric_columns = ['Open', 'Close', 'High', 'Low', 'Volume']
            for col in numeric_columns:
                if col in standardized_data.columns:
                    standardized_data[col] = pd.to_numeric(standardized_data[col], errors='coerce')
            
            # 确保Date列存在且格式正确
            if 'Date' not in standardized_data.columns and 'trade_date' in standardized_data.columns:
                standardized_data['Date'] = pd.to_datetime(standardized_data['trade_date'], errors='coerce')
            
            print(f"✅ 数据格式标准化完成: {source} -> 统一格式")
            return standardized_data
            
        except Exception as e:
            print(f"⚠️ 数据格式标准化失败: {e}")
            return data  # 返回原始数据作为备用

    def close(self):
        """
        关闭连接
        """
        if hasattr(self, 'session'):
            self.session.close()

# 兼容性别名 - 保证其他模块正常导入
DataFetcher = OptimizedDataFetcher 