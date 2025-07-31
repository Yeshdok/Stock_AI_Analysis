#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新的模块化股票分析演示脚本
展示如何使用重构后的分析模块
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.analysis.stock_analyzer import StockAnalyzer
from src.analysis.indicators import TechnicalIndicators
from src.analysis.signals import SignalGenerator
from src.analysis.charts import ChartGenerator

def demo_basic_analysis():
    """演示基本分析功能"""
    print("🚀 开始股票分析演示")
    print("="*60)
    
    # 创建分析器
    analyzer = StockAnalyzer("000001")  # 平安银行
    
    # 获取数据
    print("📊 获取股票数据...")
    if not analyzer.fetch_data("20240101", "20241231", "daily"):
        print("❌ 数据获取失败")
        return
    
    # 计算技术指标
    print("📈 计算技术指标...")
    if not analyzer.calculate_indicators():
        print("❌ 指标计算失败")
        return
    
    # 生成交易信号
    print("🎯 生成交易信号...")
    signals = analyzer.generate_trading_signals()
    if not signals:
        print("❌ 信号生成失败")
        return
    
    # 打印分析摘要
    analyzer.print_analysis_summary()
    
    return analyzer

def demo_individual_modules():
    """演示单独使用各个模块"""
    print("\n🔧 演示单独使用各个模块")
    print("="*60)
    
    # 创建分析器获取数据
    analyzer = StockAnalyzer("000001")
    analyzer.fetch_data("20240101", "20241231", "daily")
    analyzer.calculate_indicators()
    
    # 1. 单独使用技术指标模块
    print("1. 技术指标模块演示:")
    close_prices = analyzer.data['Close']
    rsi = TechnicalIndicators.calculate_rsi(close_prices, period=14)
    print(f"   RSI最新值: {rsi.iloc[-1]:.2f}")
    
    # 2. 单独使用信号生成模块
    print("2. 信号生成模块演示:")
    signal_gen = SignalGenerator(analyzer.data, analyzer.indicators)
    macd_signals = signal_gen.generate_macd_signals()
    if macd_signals and 'signals' in macd_signals:
        print(f"   MACD信号数量: {len(macd_signals['signals'])}")
        for signal in macd_signals['signals'][:2]:
            print(f"   • {signal}")
    
    # 3. 单独使用图表生成模块
    print("3. 图表生成模块演示:")
    chart_gen = ChartGenerator(analyzer.data, analyzer.indicators)
    fig = chart_gen.create_candlestick_chart("演示K线图")
    print("   K线图创建成功")
    
    return analyzer

def demo_chart_types():
    """演示不同类型的图表"""
    print("\n📊 演示不同类型的图表")
    print("="*60)
    
    analyzer = StockAnalyzer("000001")
    analyzer.fetch_data("20240101", "20241231", "daily")
    analyzer.calculate_indicators()
    
    chart_types = [
        ("comprehensive", "综合分析图"),
        ("candlestick", "K线图"),
        ("volume", "成交量图"),
        ("macd", "MACD指标图"),
        ("rsi", "RSI指标图"),
        ("chip", "筹码分布图")
    ]
    
    for chart_type, description in chart_types:
        print(f"生成{description}...")
        fig = analyzer.generate_chart(chart_type)
        if fig:
            print(f"  ✅ {description}创建成功")
        else:
            print(f"  ❌ {description}创建失败")

def demo_custom_indicators():
    """演示自定义指标计算"""
    print("\n🔬 演示自定义指标计算")
    print("="*60)
    
    analyzer = StockAnalyzer("000001")
    analyzer.fetch_data("20240101", "20241231", "daily")
    
    # 计算自定义指标
    close_prices = analyzer.data['Close']
    volume = analyzer.data['Volume']
    
    # 计算ATR
    high = analyzer.data['High']
    low = analyzer.data['Low']
    atr = TechnicalIndicators.calculate_atr(high, low, close_prices, period=14)
    print(f"ATR最新值: {atr.iloc[-1]:.4f}")
    
    # 计算随机指标
    k_percent, d_percent = TechnicalIndicators.calculate_stochastic(
        high, low, close_prices, k_period=14, d_period=3
    )
    print(f"随机指标K值: {k_percent.iloc[-1]:.2f}")
    print(f"随机指标D值: {d_percent.iloc[-1]:.2f}")
    
    # 计算筹码分布
    chip_data = TechnicalIndicators.calculate_chip_distribution(close_prices, volume)
    print(f"主要筹码峰价格: {chip_data['main_peak_price']:.2f}")
    print(f"平均成本: {chip_data['avg_price']:.2f}")
    print(f"筹码集中度: {chip_data['concentration']:.2%}")

def demo_signal_analysis():
    """演示信号分析"""
    print("\n🎯 演示信号分析")
    print("="*60)
    
    analyzer = StockAnalyzer("000001")
    analyzer.fetch_data("20240101", "20241231", "daily")
    analyzer.calculate_indicators()
    
    signal_gen = SignalGenerator(analyzer.data, analyzer.indicators)
    
    # 分析各种信号
    signal_types = [
        ("MACD信号", signal_gen.generate_macd_signals),
        ("RSI信号", signal_gen.generate_rsi_signals),
        ("布林带信号", signal_gen.generate_bollinger_signals),
        ("均线信号", signal_gen.generate_ma_signals),
        ("成交量信号", signal_gen.generate_volume_signals),
        ("筹码分布信号", signal_gen.generate_chip_signals)
    ]
    
    for signal_name, signal_func in signal_types:
        print(f"\n{signal_name}:")
        signals = signal_func()
        if signals and 'signals' in signals:
            for signal in signals['signals'][:3]:  # 显示前3个信号
                print(f"  • {signal}")
        else:
            print("  无信号")

def main():
    """主函数"""
    print("📈 股票分析模块化架构演示")
    print("="*60)
    
    try:
        # 基本分析演示
        analyzer = demo_basic_analysis()
        
        # 单独模块演示
        demo_individual_modules()
        
        # 图表类型演示
        demo_chart_types()
        
        # 自定义指标演示
        demo_custom_indicators()
        
        # 信号分析演示
        demo_signal_analysis()
        
        print("\n" + "="*60)
        print("🎉 所有演示完成！")
        print("💡 新的模块化架构提供了更好的代码组织和扩展性")
        print("📚 可以轻松添加新的技术指标、信号类型和图表类型")
        
    except Exception as e:
        print(f"❌ 演示过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 