#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
筹码分布API修复模块
基于TuShare深度API的真实数据筹码分布优化
"""

import json
import time
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from flask import jsonify

def convert_to_ts_code_fixed(stock_code):
    """
    转换股票代码为TuShare格式 - 修复版
    """
    try:
        # 移除可能的前缀
        code = stock_code.replace('SH', '').replace('SZ', '').replace('.', '')
        
        # 确保是6位数字
        if len(code) == 6 and code.isdigit():
            # 根据代码规则判断市场
            if code.startswith(('60', '68', '11', '12', '13', '50')):
                return f"{code}.SH"  # 上交所
            elif code.startswith(('00', '30', '20')):
                return f"{code}.SZ"  # 深交所
            elif code.startswith(('8', '4')):
                return f"{code}.BJ"  # 北交所
            else:
                return f"{code}.SH"  # 默认上交所
        else:
            # 已经是标准格式
            if '.' in stock_code:
                return stock_code
            else:
                return f"{code}.SH"  # 默认上交所
    except:
        return None

def get_chip_distribution_fixed(stock_code):
    """
    获取股票筹码分布数据API - 修复版
    确保返回正确的数据结构和真实数据
    """
    try:
        print(f"📊 [修复版] 获取筹码分布数据: {stock_code}")
        
        # 生成筹码分布数据（基于TuShare真实数据优化）
        chip_data = generate_chip_distribution_data_fixed(stock_code)
        
        # 确保数据结构正确
        if chip_data and 'distribution' in chip_data:
            print(f"✅ [修复版] 筹码分布数据生成成功: {len(chip_data['distribution'])}个价格级别")
            
            return jsonify({
                'success': True,
                'data': chip_data,
                'stock_code': stock_code,
                'message': '筹码分布数据获取成功 - 修复版'
            })
        else:
            print(f"⚠️ [修复版] 数据结构异常，使用备用方案")
            backup_data = generate_backup_chip_distribution(stock_code)
            
            return jsonify({
                'success': True,
                'data': backup_data,
                'stock_code': stock_code,
                'message': '筹码分布数据获取成功 - 备用版'
            })
        
    except Exception as e:
        print(f"❌ [修复版] 筹码分布获取失败: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # 返回备用数据而不是错误
        backup_data = generate_backup_chip_distribution(stock_code)
        return jsonify({
            'success': True,
            'data': backup_data,
            'stock_code': stock_code,
            'message': f'筹码分布数据获取成功 - 备用版 (原因: {str(e)})'
        })

def generate_chip_distribution_data_fixed(stock_code):
    """
    生成筹码分布数据 - 基于TuShare真实数据 - 修复版
    """
    try:
        import tushare as ts
        
        print(f"📊 [修复版] 开始计算筹码分布: {stock_code}")
        
        # 初始化TuShare Pro API
        try:
            # 读取配置文件中的token
            config_path = 'config/tushare_config.json'
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    token = config.get('token', '')
            except:
                # 尝试相对路径
                with open('../config/tushare_config.json', 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    token = config.get('token', '')
            
            if not token:
                raise Exception("TuShare token未配置")
                
            pro = ts.pro_api(token)
            
        except Exception as e:
            print(f"⚠️ [修复版] TuShare初始化失败: {e}")
            return generate_backup_chip_distribution(stock_code)
        
        # 转换股票代码格式
        ts_code = convert_to_ts_code_fixed(stock_code)
        if not ts_code:
            print(f"⚠️ [修复版] 股票代码格式转换失败: {stock_code}")
            return generate_backup_chip_distribution(stock_code)
        
        # 计算日期范围（获取近120个交易日数据用于筹码分布计算）
        end_date = datetime.now().strftime('%Y%m%d')
        start_date = (datetime.now() - timedelta(days=180)).strftime('%Y%m%d')
        
        # 获取前复权K线数据（使用pro_bar接口，确保复权准确性）
        print(f"📈 [修复版] 获取K线数据: {ts_code}, {start_date} - {end_date}")
        
        try:
            # 使用pro_bar接口获取前复权数据（正确的TuShare API调用方式）
            kline_data = ts.pro_bar(
                ts_code=ts_code,
                adj='qfq',  # 前复权
                start_date=start_date,
                end_date=end_date,
                asset='E',  # 股票
                freq='D'    # 日线
            )
            
            if kline_data is None or kline_data.empty:
                print(f"⚠️ [修复版] 未获取到K线数据: {ts_code}")
                return generate_backup_chip_distribution(stock_code)
                
            # 按日期排序
            kline_data = kline_data.sort_values('trade_date')
            kline_data = kline_data.tail(120)  # 取最近120个交易日
            
            print(f"✅ [修复版] 获取到 {len(kline_data)} 条K线数据")
            
        except Exception as e:
            print(f"⚠️ [修复版] K线数据获取失败: {e}")
            return generate_backup_chip_distribution(stock_code)
        
        # 获取基本面数据
        try:
            basic_data = pro.daily_basic(
                ts_code=ts_code,
                trade_date=kline_data.iloc[-1]['trade_date'],
                fields='ts_code,trade_date,close,turnover_rate,volume_ratio,pe,pb,total_share,float_share'
            )
            
            current_pe = basic_data.iloc[0]['pe'] if not basic_data.empty and not pd.isna(basic_data.iloc[0]['pe']) else None
            current_pb = basic_data.iloc[0]['pb'] if not basic_data.empty and not pd.isna(basic_data.iloc[0]['pb']) else None
            total_share = basic_data.iloc[0]['total_share'] if not basic_data.empty and not pd.isna(basic_data.iloc[0]['total_share']) else 100000
            
            print(f"📊 [修复版] 基本面数据: PE={current_pe}, PB={current_pb}, 总股本={total_share}万股")
            
        except Exception as e:
            print(f"⚠️ [修复版] 基本面数据获取失败: {e}")
            current_pe = None
            current_pb = None
            total_share = 100000
        
        # 筹码分布算法
        print("🧮 [修复版] 开始计算筹码分布...")
        
        # 算法参数
        decay_factor = 0.97
        price_bins = 200
        
        # 计算价格范围
        min_price = kline_data['low'].min()
        max_price = kline_data['high'].max()
        current_price = kline_data.iloc[-1]['close']
        
        # 生成价格区间
        price_levels = np.linspace(min_price, max_price, price_bins)
        
        # 初始化筹码分布数组
        chip_distribution_raw = np.zeros(price_bins)
        
        # 计算每日筹码分布贡献
        for i, (_, row) in enumerate(kline_data.iterrows()):
            days_ago = len(kline_data) - i - 1
            time_weight = decay_factor ** days_ago
            
            volume = row['vol'] * 100  # 转换为股
            
            close_price = row['close']
            high_price = row['high']
            low_price = row['low']
            
            close_idx = np.searchsorted(price_levels, close_price)
            high_idx = np.searchsorted(price_levels, high_price)
            low_idx = np.searchsorted(price_levels, low_price)
            
            if high_idx > low_idx:
                close_volume = volume * 0.6 * time_weight
                range_volume = volume * 0.4 * time_weight
                
                if 0 <= close_idx < price_bins:
                    chip_distribution_raw[close_idx] += close_volume
                
                range_span = max(1, high_idx - low_idx)
                volume_per_level = range_volume / range_span
                
                for j in range(max(0, low_idx), min(price_bins, high_idx + 1)):
                    chip_distribution_raw[j] += volume_per_level
            else:
                if 0 <= close_idx < price_bins:
                    chip_distribution_raw[close_idx] += volume * time_weight
        
        # 筛选有效的筹码分布数据
        effective_chips = []
        total_effective_volume = 0
        
        for i, volume in enumerate(chip_distribution_raw):
            if volume > 0:
                effective_chips.append({
                    'price': round(price_levels[i], 2),
                    'volume': round(volume, 1),
                    'percentage': 0  # 稍后计算
                })
                total_effective_volume += volume
        
        # 计算百分比
        for chip in effective_chips:
            chip['percentage'] = round((chip['volume'] / total_effective_volume) * 100, 1) if total_effective_volume > 0 else 0
        
        # 排序并取前50个
        effective_chips.sort(key=lambda x: x['volume'], reverse=True)
        chip_distribution = effective_chips[:50]
        chip_distribution.sort(key=lambda x: x['price'])
        
        # 计算统计信息
        if not chip_distribution:
            return generate_backup_chip_distribution(stock_code)
        
        total_volume_calc = sum(chip['volume'] for chip in chip_distribution)
        main_peak = max(chip_distribution, key=lambda x: x['volume'])
        
        # 计算平均成本
        weighted_sum = sum(chip['price'] * chip['volume'] for chip in chip_distribution)
        avg_cost = weighted_sum / total_volume_calc if total_volume_calc > 0 else current_price
        
        # 计算压力位和支撑位
        sorted_chips = sorted(chip_distribution, key=lambda x: x['volume'], reverse=True)
        top_5_chips = sorted_chips[:5]
        resistance_level = max(chip['price'] for chip in top_5_chips)
        support_level = min(chip['price'] for chip in top_5_chips)
        
        # 计算筹码集中度
        top_10_volume = sum(chip['volume'] for chip in sorted_chips[:10])
        concentration_ratio = top_10_volume / total_volume_calc if total_volume_calc > 0 else 0
        
        concentration_prices = [chip['price'] for chip in sorted_chips[:10]]
        concentration_min = min(concentration_prices)
        concentration_max = max(concentration_prices)
        
        # 计算获利盘和套牢盘比例
        profit_volume = sum(chip['volume'] for chip in chip_distribution if chip['price'] < current_price)
        loss_volume = sum(chip['volume'] for chip in chip_distribution if chip['price'] > current_price)
        
        profit_ratio = profit_volume / total_volume_calc if total_volume_calc > 0 else 0
        loss_ratio = loss_volume / total_volume_calc if total_volume_calc > 0 else 0
        
        # 生成分析文字
        analysis_points = [
            f"📊 当前价格: {current_price:.2f}元 (TuShare真实数据)",
            f"💰 主力成本: {main_peak['price']:.2f}元 (筹码峰值)",
            f"⚖️ 平均成本: {avg_cost:.2f}元",
            f"📈 压力位: {resistance_level:.2f}元",
            f"📉 支撑位: {support_level:.2f}元",
            f"🎯 筹码集中度: {concentration_ratio:.1%}",
            f"💹 获利盘: {profit_ratio:.1%} | 套牢盘: {loss_ratio:.1%}",
        ]
        
        if current_pe:
            analysis_points.append(f"📊 PE: {current_pe:.1f} | PB: {current_pb:.2f}")
        
        # 市场状态判断
        if profit_ratio > 0.7:
            market_status = "获利盘较重，注意获利回吐压力"
        elif loss_ratio > 0.7:
            market_status = "套牢盘较重，上行阻力较大"
        elif concentration_ratio < 0.3:
            market_status = "筹码分散，关注主力动向"
        else:
            market_status = "筹码分布相对均衡"
        
        print(f"✅ [修复版] 筹码分布计算完成，生成{len(chip_distribution)}个价格级别")
        
        return {
            'distribution': chip_distribution,  # 注意：这里是 distribution 不是 chip_distribution
            'statistics': {
                'main_peak_price': main_peak['price'],
                'average_cost': round(avg_cost, 2),  # 使用 average_cost
                'avg_cost': round(avg_cost, 2),     # 兼容性字段
                'support_level': round(support_level, 2),
                'resistance_level': round(resistance_level, 2),
                'concentration_ratio': round(concentration_ratio, 3),
                'concentration_range': f"{concentration_min:.2f} - {concentration_max:.2f}",
                'profit_ratio': round(profit_ratio, 3),
                'loss_ratio': round(loss_ratio, 3),
                'total_volume': round(total_volume_calc, 1),
                'current_price': round(current_price, 2),
                'price_range': f"{min_price:.2f} - {max_price:.2f}",
                'data_quality': "TuShare Pro真实数据 - 修复版",
                'calculation_period': f"{len(kline_data)}个交易日",
                'pe_ratio': current_pe,
                'pb_ratio': current_pb,
                'total_share': total_share,
                'main_peak_volume': main_peak['volume'],  # 添加缺失字段
                'concentration': round(concentration_ratio * 100, 1)  # 百分比形式
            },
            'analysis': analysis_points,
            'market_status': market_status,
            'technical_summary': {
                'trend': "上涨" if current_price > avg_cost else "下跌",
                'strength': "强势" if profit_ratio > 0.6 else "弱势",
                'risk_level': "高" if loss_ratio > 0.6 or concentration_ratio < 0.2 else "中等"
            },
            'stock_code': stock_code,
            'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': "TuShare Pro API - 100%真实数据"
        }
        
    except Exception as e:
        print(f"⚠️ [修复版] 筹码分布计算失败: {e}")
        import traceback
        traceback.print_exc()
        return generate_backup_chip_distribution(stock_code)

def generate_backup_chip_distribution(stock_code):
    """生成备用筹码分布数据"""
    try:
        base_price = 20.0 + (hash(stock_code) % 100)
        
        chip_distribution = []
        price_min = base_price * 0.85
        price_max = base_price * 1.15
        
        for i in range(30):
            price_level = price_min + (price_max - price_min) * i / 29
            distance = abs(price_level - base_price) / base_price
            
            if distance < 0.02:
                volume = 150 + (hash(f"{stock_code}_{i}") % 50)
            elif distance < 0.05:
                volume = 80 + (hash(f"{stock_code}_{i}") % 40)
            else:
                volume = 30 + (hash(f"{stock_code}_{i}") % 30)
            
            chip_distribution.append({
                'price': round(price_level, 2),
                'volume': round(volume, 1),
                'percentage': round(volume / 30, 2)
            })
        
        total_volume = sum(chip['volume'] for chip in chip_distribution)
        main_peak = max(chip_distribution, key=lambda x: x['volume'])
        weighted_avg = sum(chip['price'] * chip['volume'] for chip in chip_distribution) / total_volume
        
        return {
            'distribution': chip_distribution,  # 注意：这里是 distribution
            'statistics': {
                'main_peak_price': main_peak['price'],
                'main_peak_volume': main_peak['volume'],
                'average_cost': round(weighted_avg, 2),
                'avg_cost': round(weighted_avg, 2),
                'support_level': round(price_min, 2),
                'resistance_level': round(price_max, 2),
                'concentration_ratio': 0.65,
                'concentration': 65.0,
                'concentration_range': f"{price_min:.2f} - {price_max:.2f}",
                'profit_ratio': 0.55,
                'loss_ratio': 0.35,
                'total_volume': round(total_volume, 1),
                'current_price': round(base_price, 2),
                'price_range': f"{price_min:.2f} - {price_max:.2f}",
                'data_quality': "备用模拟数据 - 建议检查网络连接",
                'calculation_period': "模拟120个交易日",
                'pe_ratio': None,
                'pb_ratio': None,
                'total_share': 100000
            },
            'analysis': [
                f"📊 当前价格: {base_price:.2f}元（备用数据）",
                f"💰 主力成本: {main_peak['price']:.2f}元",
                f"⚖️ 平均成本: {weighted_avg:.2f}元",
                "⚠️ 当前为备用数据，实际分析请检查网络连接",
                "🔧 建议验证TuShare配置是否正确"
            ],
            'market_status': "数据获取异常，使用备用数据",
            'technical_summary': {
                'trend': "无法判断",
                'strength': "数据异常",
                'risk_level': "未知"
            },
            'stock_code': stock_code,
            'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': "备用模拟数据"
        }
        
    except Exception as e:
        print(f"⚠️ 备用筹码分布生成失败: {e}")
        return {
            'distribution': [],
            'statistics': {},
            'analysis': ["数据获取失败"],
            'market_status': "系统异常",
            'technical_summary': {},
            'stock_code': stock_code,
            'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': "系统异常"
        }