/**
 * 行为管理器 - 模拟人类请求模式
 * 实现状态机来模拟真实用户行为
 */

export default class BehaviorManager {
  constructor(logger) {
    this.logger = logger;
    
    // 状态定义
    this.STATES = {
      ACTIVE: 'ACTIVE',      // 活跃使用 - 快速请求
      THINKING: 'THINKING',  // 思考中 - 中等延迟
      IDLE: 'IDLE'          // 空闲 - 长时间暂停
    };
    
    // 当前状态
    this.currentState = this.STATES.IDLE;
    this.stateStartTime = Date.now();
    
    // 请求历史（用于模式分析）
    this.requestHistory = [];
    this.maxHistorySize = 20;
    
    // 状态转换配置
    this.stateConfig = {
      ACTIVE: {
        minDelay: 100,      // 100ms
        maxDelay: 500,      // 500ms
        minDuration: 5000,  // 至少持续5秒
        maxDuration: 30000  // 最多持续30秒
      },
      THINKING: {
        minDelay: 2000,     // 2秒
        maxDelay: 5000,     // 5秒
        minDuration: 10000, // 至少持续10秒
        maxDuration: 60000  // 最多持续60秒
      },
      IDLE: {
        minDelay: 30000,    // 30秒
        maxDelay: 120000,   // 2分钟
        minDuration: 60000, // 至少持续1分钟
        maxDuration: 300000 // 最多持续5分钟
      }
    };
    
    // 状态转换概率
    this.transitionProbabilities = {
      ACTIVE: {
        ACTIVE: 0.6,    // 60%概率保持活跃
        THINKING: 0.35, // 35%概率转为思考
        IDLE: 0.05      // 5%概率转为空闲
      },
      THINKING: {
        ACTIVE: 0.3,    // 30%概率变活跃
        THINKING: 0.5,  // 50%概率保持思考
        IDLE: 0.2       // 20%概率转为空闲
      },
      IDLE: {
        ACTIVE: 0.2,    // 20%概率突然活跃
        THINKING: 0.3,  // 30%概率开始思考
        IDLE: 0.5       // 50%概率保持空闲
      }
    };
    
    this.logger.info('行为管理器初始化完成', { 
      initialState: this.currentState 
    });
  }
  
  /**
   * 记录请求并分析模式
   */
  recordRequest() {
    const now = Date.now();
    this.requestHistory.push(now);
    
    // 保持历史记录大小
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
    
    // 检查是否需要状态转换
    this.checkStateTransition();
  }
  
  /**
   * 获取下次请求的建议延迟
   * @returns {number} 延迟毫秒数
   */
  getNextDelay() {
    const config = this.stateConfig[this.currentState];
    const delay = Math.floor(
      Math.random() * (config.maxDelay - config.minDelay) + config.minDelay
    );
    
    // 添加一些随机性（±10%）
    const variance = delay * 0.1;
    const finalDelay = delay + (Math.random() * variance * 2 - variance);
    
    this.logger.debug('计算请求延迟', {
      state: this.currentState,
      baseDelay: delay,
      finalDelay: Math.floor(finalDelay)
    });
    
    return Math.floor(finalDelay);
  }
  
  /**
   * 检查并执行状态转换
   */
  checkStateTransition() {
    const now = Date.now();
    const stateDuration = now - this.stateStartTime;
    const config = this.stateConfig[this.currentState];
    
    // 检查是否达到最小持续时间
    if (stateDuration < config.minDuration) {
      return; // 还未到转换时间
    }
    
    // 检查是否超过最大持续时间（强制转换）
    const forceTransition = stateDuration > config.maxDuration;
    
    // 计算请求频率
    const requestFrequency = this.calculateRequestFrequency();
    
    // 决定是否转换状态
    if (forceTransition || this.shouldTransition(requestFrequency)) {
      const newState = this.selectNewState();
      this.transitionTo(newState);
    }
  }
  
  /**
   * 计算最近的请求频率
   * @returns {number} 每分钟请求数
   */
  calculateRequestFrequency() {
    if (this.requestHistory.length < 2) {
      return 0;
    }
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestHistory.filter(t => t > oneMinuteAgo);
    
    return recentRequests.length;
  }
  
  /**
   * 决定是否应该转换状态
   * @param {number} requestFrequency - 请求频率
   * @returns {boolean}
   */
  shouldTransition(requestFrequency) {
    // 基于请求频率调整转换概率
    let transitionChance = 0.1; // 基础10%概率
    
    if (this.currentState === this.STATES.ACTIVE && requestFrequency < 5) {
      transitionChance = 0.5; // 活跃但请求少，50%概率转换
    } else if (this.currentState === this.STATES.IDLE && requestFrequency > 10) {
      transitionChance = 0.8; // 空闲但请求多，80%概率转换
    } else if (this.currentState === this.STATES.THINKING && requestFrequency > 20) {
      transitionChance = 0.7; // 思考但请求很多，70%概率转换
    }
    
    return Math.random() < transitionChance;
  }
  
  /**
   * 选择新状态
   * @returns {string} 新状态
   */
  selectNewState() {
    const probabilities = this.transitionProbabilities[this.currentState];
    const random = Math.random();
    
    let cumulative = 0;
    for (const [state, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (random < cumulative) {
        return state;
      }
    }
    
    // 默认保持当前状态
    return this.currentState;
  }
  
  /**
   * 转换到新状态
   * @param {string} newState - 新状态
   */
  transitionTo(newState) {
    if (newState === this.currentState) {
      return;
    }
    
    this.logger.info('行为状态转换', {
      from: this.currentState,
      to: newState,
      duration: Date.now() - this.stateStartTime
    });
    
    this.currentState = newState;
    this.stateStartTime = Date.now();
  }
  
  /**
   * 获取当前行为状态
   * @returns {object} 状态信息
   */
  getState() {
    return {
      current: this.currentState,
      duration: Date.now() - this.stateStartTime,
      requestHistory: this.requestHistory.length,
      requestFrequency: this.calculateRequestFrequency()
    };
  }
  
  /**
   * 强制设置状态（用于测试或特殊情况）
   * @param {string} state - 状态
   */
  setState(state) {
    if (!this.STATES[state]) {
      throw new Error(`Invalid state: ${state}`);
    }
    
    this.transitionTo(state);
  }
  
  /**
   * 获取统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    const now = Date.now();
    const stats = {
      currentState: this.currentState,
      stateDuration: now - this.stateStartTime,
      totalRequests: this.requestHistory.length,
      requestsPerMinute: this.calculateRequestFrequency(),
      stateHistory: this.getStateDistribution()
    };
    
    return stats;
  }
  
  /**
   * 获取状态分布（估算）
   * @returns {object} 状态分布
   */
  getStateDistribution() {
    // 基于当前状态和历史请求估算
    const frequency = this.calculateRequestFrequency();
    
    if (frequency > 15) {
      return { ACTIVE: 70, THINKING: 25, IDLE: 5 };
    } else if (frequency > 5) {
      return { ACTIVE: 30, THINKING: 50, IDLE: 20 };
    } else {
      return { ACTIVE: 10, THINKING: 30, IDLE: 60 };
    }
  }
  
  /**
   * 重置行为管理器
   */
  reset() {
    this.currentState = this.STATES.IDLE;
    this.stateStartTime = Date.now();
    this.requestHistory = [];
    
    this.logger.info('行为管理器已重置');
  }
}