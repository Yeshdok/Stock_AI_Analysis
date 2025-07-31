"""
基础分析器类
提供股票数据获取、预处理等通用功能
"""

import pandas as pd
import numpy as np
import warnings
import time
from datetime import datetime
from abc import ABC, abstractmethod
from .data_fetcher import DataFetcher

warnings.filterwarnings('ignore')

class BaseAnalyzer(ABC):
    """股票分析基础类"""
    
    def __init__(self, stock_code_or_name, period="1000"):
        """
        初始化基础分析器
        :param stock_code_or_name: A股代码或公司名称
        :param period: 获取数据的天数
        """
        # 尝试从股票数据库获取股票代码
        try:
            from src.stock_database import stock_db
            stock_info = stock_db.get_stock_info(stock_code_or_name)
            if stock_info:
                self.stock_code = stock_info['code']
                self.stock_name = stock_info['name']
            else:
                self.stock_code = stock_code_or_name
                self.stock_name = None
        except ImportError:
            self.stock_code = stock_code_or_name
            self.stock_name = None
        
        self.period = period
        self.data = None
        self.time_period = "daily"
        self.chip_data = None
        self.data_source = "unknown"
        self.data_fetcher = DataFetcher()
        
    def fetch_data(self, start_date="20220101", end_date="20251231", time_period="daily"):
        """
        获取股票数据
        :param start_date: 开始日期
        :param end_date: 结束日期  
        :param time_period: 时间周期
        """
        try:
            self.time_period = time_period
            
            # 验证日期范围
            today = datetime.now()
            
            try:
                start_dt = datetime.strptime(start_date, '%Y%m%d')
                end_dt = datetime.strptime(end_date, '%Y%m%d')
            except ValueError:
                print(f"日期格式错误，请使用YYYYMMDD格式")
                return False
            
            # 检查是否查询未来日期
            if end_dt > today:
                print(f"结束日期不能超过今天 ({today.strftime('%Y-%m-%d')})")
                end_date = today.strftime('%Y%m%d')
                print(f"自动调整结束日期为: {end_date}")
            
            if start_dt > today:
                print(f"开始日期不能超过今天 ({today.strftime('%Y-%m-%d')})")
                return False
            
            # 添加延迟避免API频率限制
            time.sleep(0.5)
            
            print(f"正在获取 {self.stock_code} 的{self._get_period_name()}数据...")
            
            # 使用增强的数据获取器获取100%真实数据
            self.data, self.data_source = self.data_fetcher.get_real_stock_data(
                stock_code=self.stock_code,
                period=time_period,
                start_date=start_date,
                end_date=end_date
            )
            
            if self.data is None or len(self.data) == 0:
                print(f"未能获取到股票 {self.stock_code} 的数据")
                return False
            
            # 获取股票名称
            try:
                time.sleep(0.5)
                self.stock_name = self.data_fetcher.get_stock_name(self.stock_code)
            except Exception as e:
                print(f"获取股票名称失败: {e}")
                self.stock_name = f"股票{self.stock_code}"
            
            print(f"数据源: {self.data_source}")
            print(f"原始列名: {list(self.data.columns) if self.data is not None else '无数据'}")
            
            # 重置索引
            self.data = self.data.reset_index(drop=True)
            
            # 确保必要的列存在
            required_cols = ['Date', 'Open', 'Close', 'High', 'Low', 'Volume']
            missing_cols = [col for col in required_cols if col not in self.data.columns]
            
            if missing_cols:
                print(f"缺少必要的列: {missing_cols}")
                return False
            
            # 数据类型转换
            numeric_cols = ['Open', 'Close', 'High', 'Low', 'Volume']
            for col in numeric_cols:
                if col in self.data.columns:
                    self.data[col] = pd.to_numeric(self.data[col], errors='coerce')
            
            # 处理日期列
            if 'Date' in self.data.columns:
                self.data['Date'] = pd.to_datetime(self.data['Date'])
            
            print(f"成功获取 {self.stock_code} ({self.stock_name}) 的{self._get_period_name()}数据，共 {len(self.data)} 条记录")
            print(f"数据时间范围: {self.data['Date'].min()} 到 {self.data['Date'].max()}")
            
            return True
            
        except Exception as e:
            print(f"获取数据失败: {e}")
            return False
    
    def _get_period_name(self):
        """获取时间周期名称"""
        period_names = {
            "daily": "日线",
            "60": "60分钟",
            "30": "30分钟", 
            "15": "15分钟"
        }
        return period_names.get(self.time_period, self.time_period)
    
    def _rename_columns(self):
        """重命名数据列"""
        if self.time_period == "daily":
            cols_mapping = {
                '日期': 'Date',
                '开盘': 'Open', 
                '收盘': 'Close',
                '最高': 'High',
                '最低': 'Low',
                '成交量': 'Volume',
                '成交额': 'Amount',
                '振幅': 'Amplitude',
                '涨跌幅': 'Pct_chg',
                '涨跌额': 'Change',
                '换手率': 'Turnover'
            }
        else:
            cols_mapping = {
                '时间': 'Date',
                '开盘': 'Open', 
                '收盘': 'Close',
                '最高': 'High',
                '最低': 'Low',
                '成交量': 'Volume',
                '成交额': 'Amount'
            }
        
        existing_cols = {k: v for k, v in cols_mapping.items() if k in self.data.columns}
        self.data = self.data.rename(columns=existing_cols)
    
    def _simulate_minute_data(self, daily_data, time_period):
        """模拟分钟级数据"""
        # 这里可以实现分钟数据的模拟逻辑
        # 暂时返回日线数据
        return daily_data
    
    @abstractmethod
    def calculate_indicators(self):
        """计算技术指标（子类必须实现）"""
        pass
    
    @abstractmethod
    def generate_signals(self):
        """生成交易信号（子类必须实现）"""
        pass 