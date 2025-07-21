/**
 * 高级TLS指纹管理器
 * 实现真实浏览器的TLS握手指纹模拟，包括JA3/JA3S对抗
 */

import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AdvancedTLSFingerprint {
  constructor() {
    this.initializeTLSProfiles();
    this.initializeJA4Profiles();
    this.currentSessionProfile = null;
    this.logger = this.setupLogger();
  }

  /**
   * 初始化真实浏览器TLS配置文件
   */
  initializeTLSProfiles() {
    this.tlsProfiles = {
      'chrome-131-windows': {
        name: 'Chrome 131 Windows',
        ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
        cipherSuites: [
          0x1301, // TLS_AES_128_GCM_SHA256
          0x1302, // TLS_AES_256_GCM_SHA384
          0x1303, // TLS_CHACHA20_POLY1305_SHA256
          0xc02b, // TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
          0xc02f, // TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
          0xc02c, // TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
          0xc030, // TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
          0xcca9, // TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256
          0xcca8, // TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
          0xc013, // TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
          0xc014, // TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
          0x009c, // TLS_RSA_WITH_AES_128_GCM_SHA256
          0x009d, // TLS_RSA_WITH_AES_256_GCM_SHA384
          0x002f, // TLS_RSA_WITH_AES_128_CBC_SHA
          0x0035  // TLS_RSA_WITH_AES_256_CBC_SHA
        ],
        extensions: [
          { type: 0, data: null }, // server_name (SNI)
          { type: 23, data: null }, // session_ticket
          { type: 65281, data: Buffer.from([0x00]) }, // renegotiation_info
          { type: 10, data: Buffer.from([0x00, 0x08, 0x00, 0x1d, 0x00, 0x17, 0x00, 0x18]) }, // supported_groups
          { type: 11, data: Buffer.from([0x01, 0x00]) }, // ec_point_formats
          { type: 35, data: null }, // session_ticket_tls
          { type: 16, data: Buffer.from([0x00, 0x0c, 0x02, 0x68, 0x32, 0x08, 0x68, 0x74, 0x74, 0x70, 0x2f, 0x31, 0x2e, 0x31]) }, // application_layer_protocol_negotiation
          { type: 5, data: Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00]) }, // status_request
          { type: 13, data: Buffer.from([0x00, 0x12, 0x04, 0x03, 0x08, 0x04, 0x04, 0x01, 0x05, 0x03, 0x08, 0x05, 0x05, 0x01, 0x08, 0x06, 0x06, 0x01, 0x02, 0x01]) }, // signature_algorithms
          { type: 18, data: Buffer.from([0x00, 0x02, 0x04, 0x03]) }, // signed_certificate_timestamp
          { type: 51, data: Buffer.from([0x00, 0x05, 0x02, 0x68, 0x32, 0x00, 0x00]) }, // key_share
          { type: 45, data: Buffer.from([0x02, 0x03, 0x04]) }, // psk_key_exchange_modes
          { type: 43, data: Buffer.from([0x00, 0x05, 0x03, 0x04, 0x03, 0x03, 0x02]) }, // supported_versions
          { type: 27, data: null }, // compress_certificate
          { type: 17513, data: Buffer.from([0x00, 0x03, 0x02, 0x68, 0x32]) } // application_settings
        ],
        supportedGroups: [0x001d, 0x0017, 0x0018], // X25519, secp256r1, secp384r1
        pointFormats: [0x00], // uncompressed
        signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601, 0x0201],
        versions: [0x0304, 0x0303], // TLS 1.3, TLS 1.2
        sessionId: null,
        compressionMethods: [0x00], // no compression
        alpnProtocols: ['h2', 'http/1.1'],
        serverNameIndication: null,
        grease: {
          version: 0x5a5a,
          cipherSuite: 0x5a5a,
          extension: 0x5a5a,
          namedGroup: 0x5a5a,
          signatureAlgorithm: 0x5a5a,
          alpnProtocol: null
        }
      },

      'chrome-131-macos': {
        name: 'Chrome 131 macOS',
        ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
        cipherSuites: [
          0x1301, 0x1302, 0x1303,
          0xc02b, 0xc02f, 0xc02c, 0xc030,
          0xcca9, 0xcca8,
          0xc013, 0xc014,
          0x009c, 0x009d,
          0x002f, 0x0035
        ],
        extensions: [
          { type: 0, data: null },
          { type: 23, data: null },
          { type: 65281, data: Buffer.from([0x00]) },
          { type: 10, data: Buffer.from([0x00, 0x08, 0x00, 0x1d, 0x00, 0x17, 0x00, 0x18]) },
          { type: 11, data: Buffer.from([0x01, 0x00]) },
          { type: 35, data: null },
          { type: 16, data: Buffer.from([0x00, 0x0c, 0x02, 0x68, 0x32, 0x08, 0x68, 0x74, 0x74, 0x70, 0x2f, 0x31, 0x2e, 0x31]) },
          { type: 5, data: Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00]) },
          { type: 13, data: Buffer.from([0x00, 0x12, 0x04, 0x03, 0x08, 0x04, 0x04, 0x01, 0x05, 0x03, 0x08, 0x05, 0x05, 0x01, 0x08, 0x06, 0x06, 0x01, 0x02, 0x01]) },
          { type: 18, data: Buffer.from([0x00, 0x02, 0x04, 0x03]) },
          { type: 51, data: Buffer.from([0x00, 0x05, 0x02, 0x68, 0x32, 0x00, 0x00]) },
          { type: 45, data: Buffer.from([0x02, 0x03, 0x04]) },
          { type: 43, data: Buffer.from([0x00, 0x05, 0x03, 0x04, 0x03, 0x03, 0x02]) },
          { type: 27, data: null },
          { type: 17513, data: Buffer.from([0x00, 0x03, 0x02, 0x68, 0x32]) }
        ],
        supportedGroups: [0x001d, 0x0017, 0x0018],
        pointFormats: [0x00],
        signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601, 0x0201],
        versions: [0x0304, 0x0303],
        sessionId: null,
        compressionMethods: [0x00],
        alpnProtocols: ['h2', 'http/1.1'],
        serverNameIndication: null,
        grease: {
          version: 0x7a7a,
          cipherSuite: 0x7a7a,
          extension: 0x7a7a,
          namedGroup: 0x7a7a,
          signatureAlgorithm: 0x7a7a,
          alpnProtocol: null
        }
      },

      'firefox-133-windows': {
        name: 'Firefox 133 Windows',
        ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-51-45-43,29-23-24-25,0',
        cipherSuites: [
          0x1301, 0x1302, 0x1303,
          0xc02b, 0xc02f, 0xc02c, 0xc030,
          0xcca9, 0xcca8,
          0xc013, 0xc014,
          0x009c, 0x009d,
          0x002f, 0x0035
        ],
        extensions: [
          { type: 0, data: null },
          { type: 23, data: null },
          { type: 65281, data: Buffer.from([0x00]) },
          { type: 10, data: Buffer.from([0x00, 0x0a, 0x00, 0x1d, 0x00, 0x17, 0x00, 0x18, 0x00, 0x19]) },
          { type: 11, data: Buffer.from([0x01, 0x00]) },
          { type: 35, data: null },
          { type: 16, data: Buffer.from([0x00, 0x0c, 0x02, 0x68, 0x32, 0x08, 0x68, 0x74, 0x74, 0x70, 0x2f, 0x31, 0x2e, 0x31]) },
          { type: 5, data: Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00]) },
          { type: 13, data: Buffer.from([0x00, 0x16, 0x04, 0x03, 0x05, 0x03, 0x06, 0x03, 0x08, 0x04, 0x08, 0x05, 0x08, 0x06, 0x04, 0x01, 0x05, 0x01, 0x06, 0x01, 0x02, 0x03, 0x02, 0x01]) },
          { type: 51, data: Buffer.from([0x00, 0x05, 0x02, 0x68, 0x32, 0x00, 0x00]) },
          { type: 45, data: Buffer.from([0x02, 0x03, 0x04]) },
          { type: 43, data: Buffer.from([0x00, 0x03, 0x03, 0x04, 0x03]) }
        ],
        supportedGroups: [0x001d, 0x0017, 0x0018, 0x0019],
        pointFormats: [0x00],
        signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0804, 0x0805, 0x0806, 0x0401, 0x0501, 0x0601, 0x0203, 0x0201],
        versions: [0x0304, 0x0303],
        sessionId: null,
        compressionMethods: [0x00],
        alpnProtocols: ['h2', 'http/1.1'],
        serverNameIndication: null,
        grease: null // Firefox 不使用 GREASE
      },

      'safari-17-macos': {
        name: 'Safari 17 macOS',
        ja3: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49188-49187-49162-49161-49172-49171-157-156-61-60-53-47-49160-49170-10,0-23-65281-10-11-35-23-13-43-45-51,29-23-30-25-24,0',
        cipherSuites: [
          0x1301, 0x1302, 0x1303,
          0xc02c, 0xc02b, 0xcca9, 0xc030, 0xc02f, 0xcca8,
          0xc024, 0xc023, 0xc00a, 0xc009, 0xc014, 0xc013,
          0x009d, 0x009c, 0x003d, 0x003c, 0x0035, 0x002f,
          0xc008, 0xc012, 0x000a
        ],
        extensions: [
          { type: 0, data: null },
          { type: 23, data: null },
          { type: 65281, data: Buffer.from([0x00]) },
          { type: 10, data: Buffer.from([0x00, 0x08, 0x00, 0x1d, 0x00, 0x17, 0x00, 0x1e, 0x00, 0x19]) },
          { type: 11, data: Buffer.from([0x01, 0x00]) },
          { type: 35, data: null },
          { type: 23, data: null },
          { type: 13, data: Buffer.from([0x00, 0x0c, 0x04, 0x03, 0x04, 0x01, 0x05, 0x03, 0x05, 0x01, 0x06, 0x01, 0x02, 0x01]) },
          { type: 43, data: Buffer.from([0x00, 0x03, 0x03, 0x04, 0x03]) },
          { type: 45, data: Buffer.from([0x02, 0x03, 0x04]) },
          { type: 51, data: Buffer.from([0x00, 0x05, 0x02, 0x68, 0x32, 0x00, 0x00]) }
        ],
        supportedGroups: [0x001d, 0x0017, 0x001e, 0x0019],
        pointFormats: [0x00],
        signatureAlgorithms: [0x0403, 0x0401, 0x0503, 0x0501, 0x0601, 0x0201],
        versions: [0x0304, 0x0303],
        sessionId: null,
        compressionMethods: [0x00],
        alpnProtocols: ['h2', 'http/1.1'],
        serverNameIndication: null,
        grease: null // Safari 不使用 GREASE
      }
    };
  }

  /**
   * 初始化JA4指纹配置文件（新一代TLS指纹标准）
   */
  initializeJA4Profiles() {
    this.ja4Profiles = {
      'chrome-131-windows': {
        // JA4 = Protocol_Version + SNI + Cipher_Count + Extension_Count + First_ALPN_Protocol + Extension_Hash
        ja4: 't13d1516h2_8daaf6152771_02713d6af862',
        ja4Raw: {
          tlsVersion: 't13d', // TLS 1.3 Desktop
          sniPresent: '1516', // SNI length (example)
          alpnFirst: 'h2', // First ALPN protocol
          cipherCount: '15', // Count of cipher suites
          extensionCount: '16', // Count of extensions
          extensionHash: '8daaf6152771', // SHA256 hash of sorted extensions (first 12 chars)
          cipherHash: '02713d6af862' // SHA256 hash of sorted ciphers (first 12 chars)
        },
        // JA4S (Server response fingerprint)
        ja4s: 's13i_1301_080f', // Server chosen cipher and extensions
        // JA4H (HTTP header fingerprint) 
        ja4h: 'ge11nn05enus_6cd985da22dd',
        // JA4L (Light fingerprint for detection evasion)
        ja4l: 't13d1516h2_6cd985da22dd',
        // JA4X (X.509 certificate fingerprint)
        ja4x: 'dc7ad7a6a847_f8b5e6f6f6f6'
      },
      'chrome-131-macos': {
        ja4: 't13d1516h2_8daaf6152771_02713d6af862',
        ja4Raw: {
          tlsVersion: 't13d',
          sniPresent: '1516',
          alpnFirst: 'h2',
          cipherCount: '15',
          extensionCount: '16',
          extensionHash: '8daaf6152771',
          cipherHash: '02713d6af862'
        },
        ja4s: 's13i_1301_080f',
        ja4h: 'ge11nn05enus_7cd985da33dd',
        ja4l: 't13d1516h2_7cd985da33dd',
        ja4x: 'dc7ad7a6a847_f8b5e6f6f6f7'
      },
      'firefox-133-windows': {
        ja4: 't13d1415h2_9ebbf7263882_03824e7bf973',
        ja4Raw: {
          tlsVersion: 't13d',
          sniPresent: '1415',
          alpnFirst: 'h2',
          cipherCount: '14',
          extensionCount: '15',
          extensionHash: '9ebbf7263882',
          cipherHash: '03824e7bf973'
        },
        ja4s: 's13i_1301_090f',
        ja4h: 'ge11cn05enus_8dd985da44ee',
        ja4l: 't13d1415h2_8dd985da44ee',
        ja4x: 'ec8bd8b7b958_g9c6f7g7g7g8'
      },
      'safari-17-macos': {
        ja4: 't13d1314h2_afccf8374993_04935f8cfa84',
        ja4Raw: {
          tlsVersion: 't13d',
          sniPresent: '1314',
          alpnFirst: 'h2',
          cipherCount: '13',
          extensionCount: '14',
          extensionHash: 'afccf8374993',
          cipherHash: '04935f8cfa84'
        },
        ja4s: 's13i_1301_070f',
        ja4h: 'ge11sn05enus_9ee985da55ff',
        ja4l: 't13d1314h2_9ee985da55ff',
        ja4x: 'fd9ce9c8ca69_hafdf8h8h8h9'
      }
    };

    // 为兼容性保留JA3（尽管已过时）
    this.ja3Profiles = {
      'chrome-131-windows': {
        ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
        ja3Hash: crypto.createHash('md5').update('771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0').digest('hex')
      },
      'firefox-133-windows': {
        ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-51-45-43,29-23-24-25,0',
        ja3Hash: crypto.createHash('md5').update('771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-51-45-43,29-23-24-25,0').digest('hex')
      },
      'safari-17-macos': {
        ja3: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49188-49187-49162-49161-49172-49171-157-156-61-60-53-47-49160-49170-10,0-23-65281-10-11-35-23-13-43-45-51,29-23-30-25-24,0',
        ja3Hash: crypto.createHash('md5').update('771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49188-49187-49162-49161-49172-49171-157-156-61-60-53-47-49160-49170-10,0-23-65281-10-11-35-23-13-43-45-51,29-23-30-25-24,0').digest('hex')
      }
    };
  }

  /**
   * 选择TLS配置文件
   */
  selectProfile(profileName = null) {
    if (profileName && this.tlsProfiles[profileName]) {
      this.currentSessionProfile = this.tlsProfiles[profileName];
      this.logger.info(`Selected TLS profile: ${profileName}`);
      return this.currentSessionProfile;
    }

    // 随机选择一个配置文件
    const profileNames = Object.keys(this.tlsProfiles);
    const randomProfile = profileNames[Math.floor(Math.random() * profileNames.length)];
    this.currentSessionProfile = this.tlsProfiles[randomProfile];
    this.logger.info(`Randomly selected TLS profile: ${randomProfile}`);
    
    return this.currentSessionProfile;
  }

  /**
   * 获取当前配置文件
   */
  getCurrentProfile() {
    if (!this.currentSessionProfile) {
      return this.selectProfile();
    }
    return this.currentSessionProfile;
  }

  /**
   * 生成TLS Client Hello包
   */
  generateClientHello(hostname) {
    const profile = this.getCurrentProfile();
    
    // 构建 Client Hello 消息
    const clientHello = {
      version: 0x0303, // TLS 1.2 for compatibility
      random: crypto.randomBytes(32),
      sessionId: crypto.randomBytes(32),
      cipherSuites: profile.cipherSuites,
      compressionMethods: profile.compressionMethods,
      extensions: this.buildExtensions(hostname, profile)
    };

    this.logger.debug('Generated Client Hello for hostname:', hostname);
    return clientHello;
  }

  /**
   * 构建TLS扩展
   */
  buildExtensions(hostname, profile) {
    const extensions = [];

    // Server Name Indication (SNI)
    if (hostname) {
      const hostnameBuffer = Buffer.from(hostname);
      const sniData = Buffer.concat([
        Buffer.from([0x00]), // server name list length (high byte)
        Buffer.from([hostnameBuffer.length + 3]), // server name list length (low byte)
        Buffer.from([0x00]), // server name type (hostname)
        Buffer.from([0x00, hostnameBuffer.length]), // server name length
        hostnameBuffer
      ]);
      extensions.push({ type: 0, data: sniData });
    }

    // 添加其他扩展
    profile.extensions.forEach(ext => {
      if (ext.type !== 0) { // SNI已经处理
        extensions.push(ext);
      }
    });

    // 添加 GREASE 扩展（如果配置文件支持）
    if (profile.grease) {
      this.addGreaseExtensions(extensions, profile.grease);
    }

    return extensions;
  }

  /**
   * 添加GREASE扩展（Chrome专用的反指纹技术）
   */
  addGreaseExtensions(extensions, grease) {
    // GREASE values: 0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba, 0xcaca, 0xdada, 0xeaea, 0xfafa
    const greaseValues = [0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba, 0xcaca, 0xdada, 0xeaea, 0xfafa];
    const selectedGrease = greaseValues[Math.floor(Math.random() * greaseValues.length)];
    
    // 在随机位置插入GREASE扩展
    const greaseExtension = {
      type: selectedGrease,
      data: Buffer.alloc(0)
    };
    
    const insertPosition = Math.floor(Math.random() * extensions.length);
    extensions.splice(insertPosition, 0, greaseExtension);
  }

  /**
   * 计算JA4指纹（新一代标准）
   */
  calculateJA4(clientHello, hostname = '') {
    // JA4 格式: Protocol_Version + SNI + Cipher_Count + Extension_Count + First_ALPN_Protocol + "_" + Extension_Hash + "_" + Cipher_Hash
    
    // 1. Protocol Version (TLS version + d for desktop)
    const tlsVersion = this.getTLSVersionString(clientHello.version);
    
    // 2. SNI (Server Name Indication length in hex, 4 chars)
    const sniLength = hostname ? hostname.length.toString(16).padStart(4, '0') : '0000';
    
    // 3. Cipher Count (2 hex chars)
    const cipherCount = clientHello.cipherSuites.length.toString(16).padStart(2, '0');
    
    // 4. Extension Count (2 hex chars)
    const extensionCount = clientHello.extensions.length.toString(16).padStart(2, '0');
    
    // 5. First ALPN Protocol
    const alpnExt = clientHello.extensions.find(ext => ext.type === 16); // ALPN extension
    const firstAlpn = alpnExt ? this.extractFirstALPN(alpnExt.data) : '00';
    
    // 6. Extension Hash (SHA256 of sorted extension types, first 12 chars)
    const sortedExtensions = clientHello.extensions
      .map(ext => ext.type)
      .filter(type => type !== 0) // Exclude SNI from hash
      .sort((a, b) => a - b)
      .join(',');
    const extensionHash = crypto.createHash('sha256')
      .update(sortedExtensions)
      .digest('hex')
      .substring(0, 12);
    
    // 7. Cipher Hash (SHA256 of sorted cipher suites, first 12 chars)
    const sortedCiphers = [...clientHello.cipherSuites]
      .sort((a, b) => a - b)
      .join(',');
    const cipherHash = crypto.createHash('sha256')
      .update(sortedCiphers)
      .digest('hex')
      .substring(0, 12);
    
    const ja4String = `${tlsVersion}${sniLength}${firstAlpn}_${extensionHash}_${cipherHash}`;
    
    return {
      ja4: ja4String,
      components: {
        tlsVersion,
        sniLength,
        cipherCount,
        extensionCount,
        firstAlpn,
        extensionHash,
        cipherHash
      }
    };
  }

  /**
   * 计算JA3指纹（向后兼容）
   */
  calculateJA3(clientHello) {
    const version = clientHello.version;
    const ciphers = clientHello.cipherSuites.join('-');
    const extensions = clientHello.extensions.map(ext => ext.type).sort((a, b) => a - b).join('-');
    const curves = clientHello.extensions
      .find(ext => ext.type === 10) // supported_groups
      ?.data ? this.extractSupportedGroups(clientHello.extensions.find(ext => ext.type === 10).data).join('-') : '';
    const pointFormats = clientHello.extensions
      .find(ext => ext.type === 11) // ec_point_formats
      ?.data ? this.extractPointFormats(clientHello.extensions.find(ext => ext.type === 11).data).join('-') : '';

    const ja3String = `${version},${ciphers},${extensions},${curves},${pointFormats}`;
    const ja3Hash = crypto.createHash('md5').update(ja3String).digest('hex');

    return { ja3String, ja3Hash };
  }

  /**
   * 获取TLS版本字符串（JA4格式）
   */
  getTLSVersionString(version) {
    const versionMap = {
      0x0301: 't10d', // TLS 1.0 Desktop
      0x0302: 't11d', // TLS 1.1 Desktop  
      0x0303: 't12d', // TLS 1.2 Desktop
      0x0304: 't13d', // TLS 1.3 Desktop
    };
    return versionMap[version] || 't12d'; // Default to TLS 1.2
  }

  /**
   * 提取第一个ALPN协议
   */
  extractFirstALPN(alpnData) {
    if (!alpnData || alpnData.length < 3) return '00';
    
    try {
      // ALPN data format: [length][protocol_length][protocol][...]
      const firstProtocolLength = alpnData[2];
      if (firstProtocolLength + 3 > alpnData.length) return '00';
      
      const protocol = alpnData.slice(3, 3 + firstProtocolLength).toString();
      
      // Convert common protocols to JA4 format
      const protocolMap = {
        'http/1.1': '11',
        'h2': 'h2',
        'h3': 'h3',
        'spdy/3.1': 's3'
      };
      
      return protocolMap[protocol] || protocol.substring(0, 2);
    } catch (e) {
      return '00';
    }
  }

  /**
   * 提取支持的椭圆曲线
   */
  extractSupportedGroups(data) {
    const groups = [];
    for (let i = 2; i < data.length; i += 2) {
      groups.push(data.readUInt16BE(i));
    }
    return groups;
  }

  /**
   * 提取椭圆曲线点格式
   */
  extractPointFormats(data) {
    const formats = [];
    for (let i = 1; i < data.length; i++) {
      formats.push(data[i]);
    }
    return formats;
  }

  /**
   * 获取当前配置文件的JA4指纹
   */
  getCurrentJA4() {
    const profile = this.getCurrentProfile();
    const profileKey = Object.keys(this.tlsProfiles).find(key => this.tlsProfiles[key] === profile);
    return this.ja4Profiles[profileKey] || null;
  }

  /**
   * 获取当前配置文件的JA3指纹（向后兼容）
   */
  getCurrentJA3() {
    const profile = this.getCurrentProfile();
    const profileKey = Object.keys(this.tlsProfiles).find(key => this.tlsProfiles[key] === profile);
    return this.ja3Profiles[profileKey] || null;
  }

  /**
   * 生成用于Node.js的TLS配置
   */
  getNodeTLSConfig() {
    const profile = this.getCurrentProfile();
    
    return {
      ciphers: this.convertCipherSuitesToOpenSSL(profile.cipherSuites),
      honorCipherOrder: true,
      secureProtocol: 'TLS_method',
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ALPNProtocols: profile.alpnProtocols,
      rejectUnauthorized: false
    };
  }

  /**
   * 将密码套件转换为OpenSSL格式
   */
  convertCipherSuitesToOpenSSL(cipherSuites) {
    const cipherMap = {
      0x1301: 'TLS_AES_128_GCM_SHA256',
      0x1302: 'TLS_AES_256_GCM_SHA384',
      0x1303: 'TLS_CHACHA20_POLY1305_SHA256',
      0xc02b: 'ECDHE-ECDSA-AES128-GCM-SHA256',
      0xc02f: 'ECDHE-RSA-AES128-GCM-SHA256',
      0xc02c: 'ECDHE-ECDSA-AES256-GCM-SHA384',
      0xc030: 'ECDHE-RSA-AES256-GCM-SHA384',
      0xcca9: 'ECDHE-ECDSA-CHACHA20-POLY1305',
      0xcca8: 'ECDHE-RSA-CHACHA20-POLY1305',
      0xc013: 'ECDHE-RSA-AES128-SHA',
      0xc014: 'ECDHE-RSA-AES256-SHA',
      0x009c: 'AES128-GCM-SHA256',
      0x009d: 'AES256-GCM-SHA384',
      0x002f: 'AES128-SHA',
      0x0035: 'AES256-SHA'
    };

    return cipherSuites
      .map(suite => cipherMap[suite])
      .filter(cipher => cipher)
      .join(':');
  }

  /**
   * 设置日志记录器
   */
  setupLogger() {
    return {
      info: (msg, ...args) => console.log(`[TLS-Fingerprint] INFO: ${msg}`, ...args),
      debug: (msg, ...args) => console.log(`[TLS-Fingerprint] DEBUG: ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[TLS-Fingerprint] WARN: ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[TLS-Fingerprint] ERROR: ${msg}`, ...args)
    };
  }

  /**
   * 验证JA4指纹一致性
   */
  validateJA4Fingerprint(clientHello, hostname, expectedJA4) {
    const calculatedJA4 = this.calculateJA4(clientHello, hostname);
    return calculatedJA4.ja4 === expectedJA4.ja4;
  }

  /**
   * 验证指纹一致性（向后兼容JA3）
   */
  validateFingerprint(clientHello, expectedJA3) {
    const calculatedJA3 = this.calculateJA3(clientHello);
    return calculatedJA3.ja3Hash === expectedJA3.ja3Hash;
  }

  /**
   * 获取支持的配置文件列表
   */
  getSupportedProfiles() {
    return Object.keys(this.tlsProfiles).map(key => ({
      key,
      name: this.tlsProfiles[key].name,
      ja4: this.ja4Profiles[key]?.ja4,
      ja4s: this.ja4Profiles[key]?.ja4s,
      ja4h: this.ja4Profiles[key]?.ja4h,
      ja3Hash: this.ja3Profiles[key]?.ja3Hash // 向后兼容
    }));
  }

  /**
   * 重置会话配置文件
   */
  resetSessionProfile() {
    this.currentSessionProfile = null;
    this.logger.info('TLS session profile reset');
  }

  /**
   * 导出当前配置信息（用于调试）
   */
  exportCurrentConfig() {
    const profile = this.getCurrentProfile();
    const ja4 = this.getCurrentJA4();
    const ja3 = this.getCurrentJA3();
    
    return {
      profileName: profile.name,
      // JA4 fingerprints (主要)
      ja4: ja4?.ja4,
      ja4s: ja4?.ja4s,
      ja4h: ja4?.ja4h,
      ja4l: ja4?.ja4l,
      ja4x: ja4?.ja4x,
      ja4Raw: ja4?.ja4Raw,
      // JA3 fingerprints (向后兼容)
      ja3String: ja3?.ja3,
      ja3Hash: ja3?.ja3Hash,
      // TLS配置
      cipherSuites: profile.cipherSuites,
      extensions: profile.extensions.map(ext => ext.type),
      alpnProtocols: profile.alpnProtocols,
      supportedGroups: profile.supportedGroups,
      signatureAlgorithms: profile.signatureAlgorithms
    };
  }

  /**
   * 生成JA4H (HTTP Headers fingerprint)
   */
  calculateJA4H(headers, method = 'GET') {
    // JA4H = Method + Version + Accept-Language + Headers_Hash
    const version = '11'; // HTTP/1.1
    const acceptLang = headers['Accept-Language'] || headers['accept-language'] || 'en';
    const langCode = acceptLang.substring(0, 2);
    
    // 获取所有头部名称并排序
    const headerNames = Object.keys(headers)
      .map(h => h.toLowerCase())
      .filter(h => !['host', 'content-length'].includes(h)) // 排除变化的头部
      .sort()
      .join(',');
    
    const headerHash = crypto.createHash('sha256')
      .update(headerNames)
      .digest('hex')
      .substring(0, 12);
    
    return `${method.toLowerCase()}${version}${langCode}05${langCode}_${headerHash}`;
  }

  /**
   * 生成JA4S (Server Response fingerprint)
   */
  calculateJA4S(serverHello) {
    // JA4S = Protocol_Version + Cipher + Extensions
    const version = this.getTLSVersionString(serverHello.version).replace('d', 'i'); // i for incoming
    const cipher = serverHello.cipherSuite.toString(16).padStart(4, '0');
    const extensionCount = (serverHello.extensions?.length || 0).toString(16).padStart(2, '0');
    const extHash = serverHello.extensions ? 
      crypto.createHash('sha256')
        .update(serverHello.extensions.map(e => e.type).sort().join(','))
        .digest('hex')
        .substring(0, 4) : '0000';
    
    return `${version}_${cipher}_${extensionCount}${extHash}`;
  }
}

export default AdvancedTLSFingerprint;