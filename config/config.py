#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
股票分析系统配置文件
"""

# Flask 应用配置
class Config:
    # 基本配置
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 8080
    
    # 数据配置
    DEFAULT_START_DATE = "20220101"
    DEFAULT_END_DATE = "20251231"
    
    # 技术指标参数
    RSI_PERIOD = 14
    MACD_FAST_PERIOD = 12
    MACD_SLOW_PERIOD = 26
    MACD_SIGNAL_PERIOD = 9
    BOLLINGER_PERIOD = 20
    BOLLINGER_STD = 2
    
    # 图表配置
    CHART_HEIGHT = 1000
    CHART_TEMPLATE = 'plotly_white'
    
    # 文件配置
    CHART_FOLDER = '.'
    CHART_EXTENSION = '.html'

# 开发环境配置
class DevelopmentConfig(Config):
    DEBUG = True

# 生产环境配置
class ProductionConfig(Config):
    DEBUG = False
    HOST = '127.0.0.1'

# 默认配置
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 