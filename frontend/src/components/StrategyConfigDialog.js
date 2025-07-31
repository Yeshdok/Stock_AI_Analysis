import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slider,
  TextField,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Settings,
  Save,
  Restore,
  Info,
} from '@mui/icons-material';
import { strategyAPI } from '../utils/api';

const StrategyConfigDialog = ({ 
  open, 
  onClose, 
  strategyId, 
  strategyName,
  onConfigSaved 
}) => {
  const [config, setConfig] = useState(null);
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && strategyId) {
      loadStrategyConfig();
    }
  }, [open, strategyId]);

  const loadStrategyConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await strategyAPI.getStrategyConfig(strategyId);
      if (response.success) {
        setConfig(response.strategy_config);
        // 初始化参数值
        const initialParams = {};
        Object.entries(response.strategy_config.params).forEach(([key, param]) => {
          initialParams[key] = param.value;
        });
        setParams(initialParams);
      } else {
        setError(response.message || '获取策略配置失败');
      }
    } catch (err) {
      setError('获取策略配置失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (paramName, newValue) => {
    setParams(prev => ({
      ...prev,
      [paramName]: newValue
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await strategyAPI.updateStrategyConfig(strategyId, params);
      if (response.success) {
        onConfigSaved && onConfigSaved(params);
        onClose();
      } else {
        setError(response.message || '保存配置失败');
      }
    } catch (err) {
      setError('保存配置失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      const resetParams = {};
      Object.entries(config.params).forEach(([key, param]) => {
        resetParams[key] = param.value;
      });
      setParams(resetParams);
    }
  };

  const renderParamControl = (paramName, paramConfig) => {
    const currentValue = params[paramName] || paramConfig.value;
    const { min, max, desc } = paramConfig;

    // 根据参数类型和范围选择合适的控件
    const isPercentage = paramName.includes('weight') || paramName.includes('ratio') || 
                        paramName.includes('threshold') || max <= 1;
    const isInteger = paramName.includes('period') || paramName.includes('count') || 
                     paramName.includes('days') || paramName.includes('freq');

    return (
      <Grid container spacing={2} alignItems="center" key={paramName}>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="primary">
            {desc || paramName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            范围: {isPercentage ? `${(min*100).toFixed(1)}% - ${(max*100).toFixed(1)}%` : 
                   `${min} - ${max}`}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Slider
            value={currentValue}
            min={min}
            max={max}
            step={isInteger ? 1 : (max - min) / 100}
            onChange={(e, newValue) => handleParamChange(paramName, newValue)}
            valueLabelDisplay="auto"
            valueLabelFormat={isPercentage ? 
              (value) => `${(value * 100).toFixed(1)}%` : 
              (value) => isInteger ? Math.round(value) : value.toFixed(3)
            }
            sx={{ 
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={2}>
          <TextField
            size="small"
            type="number"
            value={currentValue}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue) && newValue >= min && newValue <= max) {
                handleParamChange(paramName, newValue);
              }
            }}
            inputProps={{
              min,
              max,
              step: isInteger ? 1 : 'any'
            }}
            sx={{ width: '100%' }}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #1976d2, #42a5f5)', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Settings />
        策略参数配置 - {strategyName}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              正在加载策略配置...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : config ? (
          <Box>
            {/* 策略信息 */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                策略信息
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip label={`策略ID: ${strategyId}`} size="small" />
                <Chip label={`类型: ${config.type}`} size="small" color="primary" />
                <Chip label={`参数数量: ${Object.keys(config.params).length}`} size="small" color="secondary" />
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 参数配置区域 */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="primary" />
              参数配置
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 提示：调整滑块或直接输入数值来修改参数。所有参数都有合理的取值范围限制。
              </Alert>
            </Box>

            <Grid container spacing={3}>
              {Object.entries(config.params).map(([paramName, paramConfig]) => (
                <Grid item xs={12} key={paramName}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1,
                    '&:hover': { 
                      borderColor: 'primary.main',
                      boxShadow: 1
                    }
                  }}>
                    {renderParamControl(paramName, paramConfig)}
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* 配置预览 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                当前配置预览
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(params).map(([key, value]) => (
                  <Grid item key={key}>
                    <Chip 
                      label={`${key}: ${typeof value === 'number' ? value.toFixed(3) : value}`}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          取消
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outlined" 
          startIcon={<Restore />}
          disabled={saving || !config}
        >
          重置
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          disabled={saving || !config}
        >
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StrategyConfigDialog; 