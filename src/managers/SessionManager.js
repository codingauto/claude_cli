/**
 * 会话管理器 - 24小时固定IP会话管理
 * 负责会话生命周期、IP固定策略、会话续期
 */

class SessionManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger.child({ component: 'SessionManager' });
    
    // 会话配置
    this.sessionDuration = config.sessionDuration || 24 * 60 * 60 * 1000; // 24小时
    this.renewalThreshold = config.renewalThreshold || 0.9; // 90%时续期
    this.maxSessions = config.maxSessions || 10;
    
    // 当前会话状态
    this.currentSession = null;
    this.sessions = new Map();
    this.sessionHistory = [];
    
    // 定时器
    this.renewalTimer = null;
    this.cleanupTimer = null;
    
    this.startBackgroundTasks();
  }

  /**
   * 创建新会话
   */
  async createSession(proxyInfo = {}) {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const session = {
      id: sessionId,
      startTime: now,
      endTime: now + this.sessionDuration,
      proxyInfo,
      status: 'active',
      requestCount: 0,
      lastActivity: now,
      ip: proxyInfo.ip || null,
      metadata: {
        userAgent: proxyInfo.userAgent || null,
        region: proxyInfo.region || null,
        asn: proxyInfo.asn || null
      }
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    
    this.logger.info('创建新会话', {
      sessionId,
      duration: this.sessionDuration,
      ip: session.ip,
      region: session.metadata.region
    });

    this.scheduleRenewal(session);
    return session;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession() {
    if (!this.currentSession) {
      return null;
    }

    // 检查会话是否过期
    if (Date.now() > this.currentSession.endTime) {
      this.logger.warn('当前会话已过期', { 
        sessionId: this.currentSession.id,
        endTime: new Date(this.currentSession.endTime)
      });
      this.expireSession(this.currentSession.id);
      return null;
    }

    return this.currentSession;
  }

  /**
   * 更新会话活动
   */
  updateSessionActivity(sessionId = null) {
    const session = sessionId ? this.sessions.get(sessionId) : this.currentSession;
    
    if (session) {
      session.lastActivity = Date.now();
      session.requestCount++;
      
      this.logger.debug('更新会话活动', {
        sessionId: session.id,
        requestCount: session.requestCount,
        lastActivity: new Date(session.lastActivity)
      });
    }
  }

  /**
   * 续期会话
   */
  async renewSession(sessionId = null) {
    const session = sessionId ? this.sessions.get(sessionId) : this.currentSession;
    
    if (!session) {
      this.logger.warn('尝试续期不存在的会话', { sessionId });
      return false;
    }

    const now = Date.now();
    const newEndTime = now + this.sessionDuration;
    
    session.endTime = newEndTime;
    session.lastActivity = now;
    session.status = 'renewed';

    this.logger.info('会话续期成功', {
      sessionId: session.id,
      newEndTime: new Date(newEndTime),
      ip: session.ip
    });

    this.scheduleRenewal(session);
    return true;
  }

  /**
   * 使会话过期
   */
  expireSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.status = 'expired';
      session.endTime = Date.now();
      
      // 移到历史记录
      this.sessionHistory.push({
        ...session,
        duration: session.endTime - session.startTime
      });
      
      this.sessions.delete(sessionId);
      
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = null;
      }
      
      this.logger.info('会话已过期', {
        sessionId: session.id,
        duration: session.endTime - session.startTime,
        requestCount: session.requestCount
      });
    }
  }

  /**
   * 检查是否需要续期
   */
  shouldRenew(session = null) {
    const target = session || this.currentSession;
    
    if (!target) return false;
    
    const now = Date.now();
    const elapsed = now - target.startTime;
    const progress = elapsed / this.sessionDuration;
    
    return progress >= this.renewalThreshold;
  }

  /**
   * 获取会话统计
   */
  getStats() {
    const current = this.currentSession;
    const totalSessions = this.sessions.size + this.sessionHistory.length;
    const totalRequests = [...this.sessions.values(), ...this.sessionHistory]
      .reduce((sum, session) => sum + session.requestCount, 0);

    return {
      current: current ? {
        id: current.id,
        startTime: current.startTime,
        endTime: current.endTime,
        status: current.status,
        requestCount: current.requestCount,
        ip: current.ip,
        timeRemaining: current.endTime - Date.now(),
        progress: (Date.now() - current.startTime) / this.sessionDuration
      } : null,
      total: {
        sessions: totalSessions,
        requests: totalRequests,
        activeSessions: this.sessions.size,
        expiredSessions: this.sessionHistory.length
      }
    };
  }

  /**
   * 安排会话续期
   */
  scheduleRenewal(session) {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
    }

    const renewalTime = session.startTime + (this.sessionDuration * this.renewalThreshold);
    const delay = renewalTime - Date.now();

    if (delay > 0) {
      this.renewalTimer = setTimeout(() => {
        if (this.shouldRenew(session)) {
          this.renewSession(session.id);
        }
      }, delay);

      this.logger.debug('安排会话续期', {
        sessionId: session.id,
        renewalTime: new Date(renewalTime),
        delay
      });
    }
  }

  /**
   * 启动后台任务
   */
  startBackgroundTasks() {
    // 定期清理过期会话
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // 每分钟检查一次

    this.logger.debug('启动会话管理后台任务');
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.endTime) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.expireSession(sessionId);
    });

    // 限制历史记录大小
    if (this.sessionHistory.length > 100) {
      this.sessionHistory = this.sessionHistory.slice(-50);
    }

    if (expiredSessions.length > 0) {
      this.logger.debug('清理过期会话', { 
        expired: expiredSessions.length,
        remaining: this.sessions.size 
      });
    }
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 关闭会话管理器
   */
  close() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 清理所有活跃会话
    for (const sessionId of this.sessions.keys()) {
      this.expireSession(sessionId);
    }

    this.logger.info('会话管理器已关闭');
  }
}

export default SessionManager; 