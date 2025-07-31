#!/usr/bin/env python3
"""
量化分析符合度评估器 - 基于策略标准的100分制评分系统
Strategy Compliance Evaluator with 100-point scoring system
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

class ComplianceEvaluator:
    """
    股票策略符合度评估器
    基于具体策略标准的100分制评分系统
    """
    
    def __init__(self):
        """初始化符合度评估器"""
        self.logger = logging.getLogger(__name__)
        
        # 策略标准定义 - 每个策略的具体要求
        self.strategy_standards = {
            'high_dividend': {
                'name': '高股息策略',
                'criteria': {
                    'dividend_yield_min': 4.5,     # 股息率最小值
                    'pe_min': 5, 'pe_max': 18,      # PE范围
                    'pb_min': 0.5, 'pb_max': 2.5,   # PB范围
                    'roe_min': 10,                   # ROE最小值
                    'market_cap_min': 300,           # 最小市值(亿)
                    'debt_ratio_max': 50,            # 最大负债率
                },
                'weights': {  # 各指标权重
                    'dividend_yield': 30,  # 股息率权重最高
                    'pe': 20,
                    'pb': 15,
                    'roe': 15,
                    'market_cap': 10,
                    'debt_ratio': 10
                }
            },
            'blue_chip': {
                'name': '蓝筹白马策略', 
                'criteria': {
                    'pe_min': 8, 'pe_max': 25,
                    'pb_min': 0.8, 'pb_max': 3.5,
                    'roe_min': 12,
                    'market_cap_min': 1000,  # 大盘股
                    'revenue_growth_min': 8,
                    'debt_ratio_max': 45,
                },
                'weights': {
                    'pe': 25,
                    'pb': 20,
                    'roe': 20,
                    'market_cap': 15,
                    'revenue_growth': 10,
                    'debt_ratio': 10
                }
            },
            'quality_growth': {
                'name': '质量成长策略',
                'criteria': {
                    'pe_min': 15, 'pe_max': 40,
                    'pb_min': 1.5, 'pb_max': 6,
                    'roe_min': 18,
                    'revenue_growth_min': 20,
                    'profit_growth_min': 25,
                    'market_cap_min': 150,
                    'gross_margin_min': 35,
                },
                'weights': {
                    'roe': 25,
                    'revenue_growth': 25,
                    'pe': 20,
                    'pb': 15,
                    'profit_growth': 10,
                    'gross_margin': 5
                }
            },
            'value_investment': {
                'name': '深度价值投资策略',
                'criteria': {
                    'pe_min': 3, 'pe_max': 12,
                    'pb_min': 0.4, 'pb_max': 1.8,
                    'roe_min': 10,
                    'market_cap_min': 80,
                    'debt_ratio_max': 55,
                    'current_ratio_min': 1.2,
                },
                'weights': {
                    'pe': 30,
                    'pb': 25,
                    'roe': 20,
                    'debt_ratio': 15,
                    'current_ratio': 10
                }
            }
        }
        
    def evaluate_stock_compliance(self, stock_data: Dict, strategy_type: str = 'balanced', fast_mode: bool = True) -> Dict:
        """
        评估单只股票的策略符合度 - 100分制
        
        Args:
            stock_data: 股票数据字典
            strategy_type: 策略类型 
            fast_mode: 快速模式（暂时保留兼容性）
            
        Returns:
            符合度评估结果字典
        """
        try:
            # 🎯 核心优化：直接基于策略标准计算100分制评分
            strategy_score = self._calculate_strategy_based_score(stock_data, strategy_type)
            
            # 符合度等级评定
            compliance_grade = self._get_compliance_grade(strategy_score)
            
            # 风险调整后符合度
            risk_adjusted_score = self._apply_risk_adjustment(strategy_score, stock_data)
            
            return {
                'overall_compliance': round(strategy_score, 2),
                'risk_adjusted_compliance': round(risk_adjusted_score, 2),
                'compliance_grade': compliance_grade,
                'strategy_score': round(strategy_score, 2),  # 新增：策略评分
                'evaluation_details': self._generate_evaluation_details(
                    stock_data, strategy_score, compliance_grade, strategy_type
                ),
                'recommendation': self._generate_recommendation(strategy_score, strategy_type)
            }
            
        except Exception as e:
            self.logger.error(f"符合度评估失败: {e}")
            return self._get_default_compliance_result()
    
    def _calculate_strategy_based_score(self, stock_data: Dict, strategy_type: str) -> float:
        """
        基于策略标准计算100分制评分
        完全符合策略标准 = 100分，每个维度根据符合程度加分减分
        """
        try:
            # 🔍 策略映射 - 处理前端传入的策略ID
            strategy_mapping = {
                'high_dividend': 'high_dividend',
                'blue_chip_stable': 'blue_chip', 
                'blue_chip': 'blue_chip',
                'quality_growth': 'quality_growth',
                'value_investment': 'value_investment',
                'value': 'value_investment',
                'growth': 'quality_growth',
                'dividend': 'high_dividend',
                'balanced': 'blue_chip'  # 平衡策略使用蓝筹标准
            }
            
            strategy_key = strategy_mapping.get(strategy_type, 'blue_chip')
            
            if strategy_key not in self.strategy_standards:
                print(f"⚠️ 未知策略类型 {strategy_type}，使用蓝筹白马标准")
                strategy_key = 'blue_chip'
            
            strategy_config = self.strategy_standards[strategy_key]
            criteria = strategy_config['criteria']
            weights = strategy_config['weights']
            
            print(f"📊 使用策略标准: {strategy_config['name']}")
            
            total_score = 0.0
            total_weight = 0
            
            # 🎯 核心算法：每个指标的符合度评分
            
            # 1. 股息率评分 (仅高股息策略)
            if 'dividend_yield' in weights:
                dividend_yield = stock_data.get('dividend_yield', 0)
                target_min = criteria.get('dividend_yield_min', 4.5)
                score = self._score_indicator(dividend_yield, target_min, None, 'min_better')
                total_score += score * weights['dividend_yield']
                total_weight += weights['dividend_yield']
                print(f"   股息率: {dividend_yield:.2f}% (目标≥{target_min}%) = {score:.1f}分")
            
            # 2. PE评分
            if 'pe' in weights:
                pe = stock_data.get('pe', 0)
                pe_min = criteria.get('pe_min', 0)
                pe_max = criteria.get('pe_max', 100)
                score = self._score_indicator(pe, pe_min, pe_max, 'range')
                total_score += score * weights['pe']
                total_weight += weights['pe']
                print(f"   PE: {pe:.2f} (目标{pe_min}-{pe_max}) = {score:.1f}分")
            
            # 3. PB评分
            if 'pb' in weights:
                pb = stock_data.get('pb', 0)
                pb_min = criteria.get('pb_min', 0)
                pb_max = criteria.get('pb_max', 100)
                score = self._score_indicator(pb, pb_min, pb_max, 'range')
                total_score += score * weights['pb']
                total_weight += weights['pb']
                print(f"   PB: {pb:.2f} (目标{pb_min}-{pb_max}) = {score:.1f}分")
            
            # 4. ROE评分
            if 'roe' in weights:
                roe = stock_data.get('roe', 0)
                roe_min = criteria.get('roe_min', 8)
                score = self._score_indicator(roe, roe_min, None, 'min_better')
                total_score += score * weights['roe']
                total_weight += weights['roe']
                print(f"   ROE: {roe:.2f}% (目标≥{roe_min}%) = {score:.1f}分")
            
            # 5. 市值评分
            if 'market_cap' in weights:
                market_cap = stock_data.get('total_mv', 0)  # 亿元
                market_cap_min = criteria.get('market_cap_min', 100)
                score = self._score_indicator(market_cap, market_cap_min, None, 'min_better')
                total_score += score * weights['market_cap']
                total_weight += weights['market_cap']
                print(f"   市值: {market_cap:.1f}亿 (目标≥{market_cap_min}亿) = {score:.1f}分")
            
            # 6. 营收增长率评分
            if 'revenue_growth' in weights:
                revenue_growth = stock_data.get('revenue_growth', 0)
                growth_min = criteria.get('revenue_growth_min', 8)
                score = self._score_indicator(revenue_growth, growth_min, None, 'min_better')
                total_score += score * weights['revenue_growth']
                total_weight += weights['revenue_growth']
                print(f"   营收增长: {revenue_growth:.2f}% (目标≥{growth_min}%) = {score:.1f}分")
            
            # 7. 负债率评分
            if 'debt_ratio' in weights:
                debt_ratio = stock_data.get('debt_ratio', 50)
                debt_max = criteria.get('debt_ratio_max', 50)
                score = self._score_indicator(debt_ratio, None, debt_max, 'max_better')
                total_score += score * weights['debt_ratio']
                total_weight += weights['debt_ratio']
                print(f"   负债率: {debt_ratio:.2f}% (目标≤{debt_max}%) = {score:.1f}分")
            
            # 8. 流动比率评分
            if 'current_ratio' in weights:
                current_ratio = stock_data.get('current_ratio', 1.0)
                ratio_min = criteria.get('current_ratio_min', 1.2)
                score = self._score_indicator(current_ratio, ratio_min, None, 'min_better')
                total_score += score * weights['current_ratio']
                total_weight += weights['current_ratio']
                print(f"   流动比率: {current_ratio:.2f} (目标≥{ratio_min}) = {score:.1f}分")
            
            # 计算加权平均分
            if total_weight > 0:
                final_score = total_score / total_weight
            else:
                final_score = 50.0  # 默认分数
            
            print(f"📊 策略符合度总分: {final_score:.2f}/100")
            
            return max(0, min(100, final_score))
            
        except Exception as e:
            self.logger.error(f"策略评分计算失败: {e}")
            return 50.0
    
    def _score_indicator(self, value: float, target_min: Optional[float], target_max: Optional[float], score_type: str) -> float:
        """
        单个指标评分算法
        
        Args:
            value: 实际值
            target_min: 目标最小值
            target_max: 目标最大值  
            score_type: 评分类型 ('range', 'min_better', 'max_better')
        
        Returns:
            评分 (0-100)
        """
        if value is None or value <= 0:
            return 0.0
        
        if score_type == 'range':
            # 区间评分：在目标区间内得满分
            if target_min is not None and target_max is not None:
                if target_min <= value <= target_max:
                    return 100.0  # 完全符合
                elif value < target_min:
                    # 低于最小值，按比例扣分
                    ratio = value / target_min
                    return max(0, ratio * 100)
                else:
                    # 高于最大值，按比例扣分
                    excess_ratio = (value - target_max) / target_max
                    return max(0, 100 - excess_ratio * 50)  # 超出越多扣分越多
        
        elif score_type == 'min_better':
            # 越高越好：达到目标值得满分，超出有奖励
            if target_min is not None:
                if value >= target_min:
                    # 达到目标，基础100分 + 超出奖励
                    bonus = min(20, (value - target_min) / target_min * 20)  # 最多20分奖励
                    return min(100, 100 + bonus)
                else:
                    # 未达到目标，按比例给分
                    ratio = value / target_min
                    return max(0, ratio * 100)
        
        elif score_type == 'max_better':
            # 越低越好：低于目标值得满分
            if target_max is not None:
                if value <= target_max:
                    return 100.0  # 完全符合
                else:
                    # 超出目标值，按比例扣分
                    excess_ratio = (value - target_max) / target_max
                    return max(0, 100 - excess_ratio * 100)
        
        return 50.0  # 默认分数
    
    def _apply_risk_adjustment(self, base_score: float, stock_data: Dict) -> float:
        """应用风险调整"""
        try:
            # 简化的风险调整
            volatility = stock_data.get('volatility', 25.0)
            market_cap = stock_data.get('total_mv', 100)
            
            # 波动率调整 (高波动率轻微惩罚)
            volatility_penalty = min(5, max(0, (volatility - 30) * 0.2))
            
            # 流动性调整 (大盘股流动性奖励)
            liquidity_bonus = min(3, market_cap / 500)
            
            adjusted_score = base_score - volatility_penalty + liquidity_bonus
            
            return max(0, min(100, adjusted_score))
            
        except Exception as e:
            self.logger.warning(f"风险调整失败: {e}")
            return base_score
    
    def _get_compliance_grade(self, compliance_score: float) -> str:
        """获取符合度等级"""
        if compliance_score >= 90:
            return "优秀"
        elif compliance_score >= 80:
            return "良好"
        elif compliance_score >= 70:
            return "中等"
        elif compliance_score >= 60:
            return "一般"
        elif compliance_score >= 50:
            return "较差"
        else:
            return "不符合"
    
    def _generate_evaluation_details(self, stock_data: Dict, compliance: float, grade: str, strategy_type: str) -> str:
        """生成评估详情说明"""
        stock_code = stock_data.get('stock_code', 'N/A')
        stock_name = stock_data.get('stock_name', 'N/A')
        
        details = f"股票{stock_code} {stock_name}在{strategy_type}策略下的符合度为{compliance:.1f}分({grade}级)"
        
        # 添加关键指标说明
        pe = stock_data.get('pe', 0)
        pb = stock_data.get('pb', 0)
        roe = stock_data.get('roe', 0)
        
        if pe > 0:
            details += f"，PE={pe:.1f}"
        if pb > 0:
            details += f"，PB={pb:.1f}"
        if roe > 0:
            details += f"，ROE={roe:.1f}%"
            
        return details
    
    def _generate_recommendation(self, compliance: float, strategy_type: str) -> str:
        """生成投资建议"""
        if compliance >= 90:
            return f"强烈推荐：{strategy_type}策略高度符合，建议重点关注"
        elif compliance >= 80:
            return f"推荐：{strategy_type}策略符合度良好，可考虑投资"
        elif compliance >= 70:
            return f"中性：{strategy_type}策略符合度中等，谨慎考虑"
        elif compliance >= 60:
            return f"观望：{strategy_type}策略符合度一般，建议观望"
        else:
            return f"不推荐：{strategy_type}策略符合度较低，不建议投资"
    
    def _get_default_compliance_result(self) -> Dict:
        """获取默认符合度结果（异常情况）"""
        return {
            'overall_compliance': 50.0,
            'risk_adjusted_compliance': 45.0,
            'compliance_grade': '数据不足',
            'strategy_score': 50.0,
            'evaluation_details': '数据不足，无法准确评估',
            'recommendation': '数据不足，建议补充信息后重新评估'
        }
    
    def calculate_portfolio_compliance_stats(self, compliance_results: List[Dict]) -> Dict:
        """计算投资组合符合度统计"""
        try:
            if not compliance_results:
                return {'success_rate': 0.0, 'avg_compliance': 0.0}
            
            compliances = [r['overall_compliance'] for r in compliance_results]
            risk_adjusted = [r['risk_adjusted_compliance'] for r in compliance_results]
            
            # 重新定义成功率：符合度≥70分的股票比例
            high_compliance_count = len([c for c in compliances if c >= 70])
            success_rate = (high_compliance_count / len(compliances)) * 100
            
            # 优秀符合度比例：符合度≥90分
            excellent_count = len([c for c in compliances if c >= 90])
            excellent_rate = (excellent_count / len(compliances)) * 100
            
            stats = {
                'success_rate': round(success_rate, 1),  # 符合度≥70%的成功率
                'excellent_rate': round(excellent_rate, 1),  # 优秀符合度比例
                'avg_compliance': round(np.mean(compliances), 1),
                'avg_risk_adjusted': round(np.mean(risk_adjusted), 1),
                'compliance_std': round(np.std(compliances), 1),
                'median_compliance': round(np.median(compliances), 1),
                'total_analyzed': len(compliance_results),
                'high_compliance_count': high_compliance_count,
                'excellent_count': excellent_count,
                'compliance_distribution': {
                    'excellent': excellent_count,
                    'good': len([c for c in compliances if 80 <= c < 90]),
                    'fair': len([c for c in compliances if 70 <= c < 80]),
                    'poor': len([c for c in compliances if c < 70])
                }
            }
            
            return stats
            
        except Exception as e:
            self.logger.error(f"投资组合统计计算失败: {e}")
            return {'success_rate': 0.0, 'avg_compliance': 0.0}

# 兼容性函数 - 保持原有接口
def evaluate_stock_compliance_fast(stock_data: Dict, strategy_type: str) -> Dict:
    """快速符合度评估 - 兼容性接口"""
    evaluator = ComplianceEvaluator()
    return evaluator.evaluate_stock_compliance(stock_data, strategy_type, fast_mode=True) 