/**
 * 设备指纹模拟系统
 * 实现Canvas、WebGL、字体指纹等设备特征模拟
 */

import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeviceFingerprint {
  constructor() {
    this.initializeDeviceProfiles();
    this.currentDeviceProfile = null;
    this.sessionConsistency = new Map();
    this.logger = this.setupLogger();
  }

  /**
   * 初始化设备配置文件库
   */
  initializeDeviceProfiles() {
    this.deviceProfiles = {
      'chrome-131-windows-desktop': {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        screen: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          pixelDepth: 24,
          availWidth: 1920,
          availHeight: 1040
        },
        timezone: 'America/New_York',
        language: 'en-US',
        languages: ['en-US', 'en'],
        cookieEnabled: true,
        doNotTrack: null,
        canvas: {
          // Canvas指纹是基于不同硬件渲染差异生成的
          fingerprint: '3a847d2c9f8b6e4d7a1c5b9f8e3d2c1a',
          // 模拟真实Canvas渲染结果
          textMetrics: {
            width: 156.78515625,
            actualBoundingBoxLeft: 0.421875,
            actualBoundingBoxRight: 156.3671875,
            fontBoundingBoxAscent: 14,
            fontBoundingBoxDescent: 4
          },
          // Canvas像素数据hash
          imageDataHash: '9f8e7d6c5b4a39281706f5e4d3c2b1a0'
        },
        webgl: {
          vendor: 'Google Inc. (NVIDIA)',
          renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB (0x00001C03) Direct3D11 vs_5_0 ps_5_0, D3D11)',
          version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
          extensions: [
            'ANGLE_instanced_arrays',
            'EXT_blend_minmax',
            'EXT_color_buffer_half_float',
            'EXT_disjoint_timer_query',
            'EXT_float_blend',
            'EXT_frag_depth',
            'EXT_shader_texture_lod',
            'EXT_texture_compression_bptc',
            'EXT_texture_compression_rgtc',
            'EXT_texture_filter_anisotropic',
            'EXT_sRGB',
            'KHR_parallel_shader_compile',
            'OES_element_index_uint',
            'OES_fbo_render_mipmap',
            'OES_standard_derivatives',
            'OES_texture_float',
            'OES_texture_float_linear',
            'OES_texture_half_float',
            'OES_texture_half_float_linear',
            'OES_vertex_array_object',
            'WEBGL_color_buffer_float',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_compressed_texture_s3tc_srgb',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_depth_texture',
            'WEBGL_draw_buffers',
            'WEBGL_lose_context',
            'WEBGL_multi_draw'
          ],
          parameters: {
            MAX_VIEWPORT_DIMS: [32767, 32767],
            MAX_TEXTURE_SIZE: 16384,
            MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
            MAX_RENDERBUFFER_SIZE: 16384,
            MAX_VERTEX_ATTRIBS: 16,
            MAX_VARYING_VECTORS: 30,
            MAX_VERTEX_UNIFORM_VECTORS: 4095,
            MAX_FRAGMENT_UNIFORM_VECTORS: 4095
          },
          // WebGL指纹基于GPU渲染的唯一性
          fingerprint: 'b7c6a5d49e38f72816e0c9b5a4d3e2f1'
        },
        fonts: {
          // 系统安装的字体列表
          available: [
            'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 
            'Consolas', 'Courier New', 'Georgia', 'Impact', 'Lucida Console',
            'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
            'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
            'Symbol', 'Wingdings', 'MS Gothic', 'MS Mincho'
          ],
          // 字体指纹基于渲染差异
          fingerprint: 'f8e7d6c5b4a392817065f4e3d2c1b0a9'
        },
        audio: {
          // 音频指纹基于音频处理差异
          fingerprint: 'a9b8c7d6e5f4032918273645f5e4d3c2',
          // 音频上下文属性
          sampleRate: 48000,
          maxChannelCount: 2,
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers'
        },
        hardware: {
          // 硬件信息
          hardwareConcurrency: 8,
          deviceMemory: 8,
          maxTouchPoints: 0,
          pointerEvents: true,
          // 传感器
          sensors: {
            accelerometer: false,
            gyroscope: false,
            magnetometer: false,
            ambientLightSensor: false,
            geolocation: true
          }
        },
        browser: {
          // 浏览器特性
          cookieEnabled: true,
          javaEnabled: false,
          onLine: true,
          pdfViewerEnabled: true,
          vendor: 'Google Inc.',
          vendorSub: '',
          productSub: '20030107',
          appCodeName: 'Mozilla',
          appName: 'Netscape',
          appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          buildID: undefined,
          oscpu: undefined
        },
        css: {
          // CSS特性支持
          supports: {
            'display: flex': true,
            'display: grid': true,
            'transform: rotate(45deg)': true,
            'filter: blur(5px)': true,
            'backdrop-filter: blur(5px)': true,
            'clip-path: circle(50%)': true
          },
          // CSS媒体查询
          mediaQueries: {
            'prefers-color-scheme: dark': false,
            'prefers-reduced-motion: reduce': false,
            'prefers-contrast: high': false,
            'forced-colors: active': false
          }
        },
        permissions: {
          // 权限状态
          camera: 'prompt',
          microphone: 'prompt',
          geolocation: 'prompt',
          notifications: 'default',
          'persistent-storage': 'prompt',
          'background-sync': 'granted'
        },
        // 设备指纹综合hash
        deviceId: 'chr131win_8f7e6d5c4b3a291807f65e4d3c2b1a09'
      },

      'chrome-131-macos-desktop': {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        screen: {
          width: 2560,
          height: 1440,
          colorDepth: 24,
          pixelDepth: 24,
          availWidth: 2560,
          availHeight: 1385
        },
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        languages: ['en-US', 'en'],
        cookieEnabled: true,
        doNotTrack: null,
        canvas: {
          fingerprint: '7f6e5d4c3b2a190816f75e4d3c2b1a98',
          textMetrics: {
            width: 157.2265625,
            actualBoundingBoxLeft: 0.41796875,
            actualBoundingBoxRight: 156.8125,
            fontBoundingBoxAscent: 14,
            fontBoundingBoxDescent: 4
          },
          imageDataHash: 'e9d8c7b6a5948372615f04e3d2c1b0a9'
        },
        webgl: {
          vendor: 'Google Inc. (Apple)',
          renderer: 'ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)',
          version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
          shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
          extensions: [
            'ANGLE_instanced_arrays',
            'EXT_blend_minmax',
            'EXT_color_buffer_half_float',
            'EXT_disjoint_timer_query',
            'EXT_float_blend',
            'EXT_frag_depth',
            'EXT_shader_texture_lod',
            'EXT_texture_compression_rgtc',
            'EXT_texture_filter_anisotropic',
            'EXT_sRGB',
            'KHR_parallel_shader_compile',
            'OES_element_index_uint',
            'OES_fbo_render_mipmap',
            'OES_standard_derivatives',
            'OES_texture_float',
            'OES_texture_float_linear',
            'OES_texture_half_float',
            'OES_texture_half_float_linear',
            'OES_vertex_array_object',
            'WEBGL_color_buffer_float',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_depth_texture',
            'WEBGL_draw_buffers',
            'WEBGL_lose_context',
            'WEBGL_multi_draw'
          ],
          parameters: {
            MAX_VIEWPORT_DIMS: [16384, 16384],
            MAX_TEXTURE_SIZE: 16384,
            MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
            MAX_RENDERBUFFER_SIZE: 16384,
            MAX_VERTEX_ATTRIBS: 16,
            MAX_VARYING_VECTORS: 31,
            MAX_VERTEX_UNIFORM_VECTORS: 1024,
            MAX_FRAGMENT_UNIFORM_VECTORS: 1024
          },
          fingerprint: 'c1b0a9d8e7f6254839f72816e5d4c3b2'
        },
        fonts: {
          available: [
            'Helvetica Neue', 'Helvetica', 'Arial', 'Lucida Grande', 'Verdana',
            'Geneva', 'Georgia', 'Times', 'Times New Roman', 'Trebuchet MS',
            'Courier', 'Courier New', 'Palatino', 'Optima', 'Futura',
            'Menlo', 'Monaco', 'Consolas', 'Symbol', 'Zapf Dingbats',
            'SF Pro Display', 'SF Pro Text', 'PingFang SC', 'Hiragino Sans'
          ],
          fingerprint: 'b2a19f8e7d6c5043928f17e6d5c4b3a2'
        },
        audio: {
          fingerprint: 'd3c2b1a09f8e7654038291f7e6d5c4b3',
          sampleRate: 48000,
          maxChannelCount: 2,
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers'
        },
        hardware: {
          hardwareConcurrency: 10,
          deviceMemory: 16,
          maxTouchPoints: 0,
          pointerEvents: true,
          sensors: {
            accelerometer: false,
            gyroscope: false,
            magnetometer: false,
            ambientLightSensor: false,
            geolocation: true
          }
        },
        browser: {
          cookieEnabled: true,
          javaEnabled: false,
          onLine: true,
          pdfViewerEnabled: true,
          vendor: 'Google Inc.',
          vendorSub: '',
          productSub: '20030107',
          appCodeName: 'Mozilla',
          appName: 'Netscape',
          appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          buildID: undefined,
          oscpu: undefined
        },
        css: {
          supports: {
            'display: flex': true,
            'display: grid': true,
            'transform: rotate(45deg)': true,
            'filter: blur(5px)': true,
            'backdrop-filter: blur(5px)': true,
            'clip-path: circle(50%)': true
          },
          mediaQueries: {
            'prefers-color-scheme: dark': false,
            'prefers-reduced-motion: reduce': false,
            'prefers-contrast: high': false,
            'forced-colors: active': false
          }
        },
        permissions: {
          camera: 'prompt',
          microphone: 'prompt',
          geolocation: 'prompt',
          notifications: 'default',
          'persistent-storage': 'prompt',
          'background-sync': 'granted'
        },
        deviceId: 'chr131mac_f9e8d7c6b5a4039281f7e6d5c4b3a201'
      },

      'firefox-133-windows-desktop': {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
        screen: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          pixelDepth: 24,
          availWidth: 1920,
          availHeight: 1040
        },
        timezone: 'America/New_York',
        language: 'en-US',
        languages: ['en-US', 'en'],
        cookieEnabled: true,
        doNotTrack: 'unspecified',
        canvas: {
          fingerprint: '6e5d4c3b2a190817f6e5d4c3b2a19087',
          textMetrics: {
            width: 155.94921875,
            actualBoundingBoxLeft: 0.375,
            actualBoundingBoxRight: 155.578125,
            fontBoundingBoxAscent: 14,
            fontBoundingBoxDescent: 4
          },
          imageDataHash: 'd8c7b6a59483726150e3d2c1b0a98f7e'
        },
        webgl: {
          vendor: 'Mozilla',
          renderer: 'Mozilla -- ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB (0x00001C03) Direct3D11 vs_5_0 ps_5_0, D3D11)',
          version: 'WebGL 1.0',
          shadingLanguageVersion: 'WebGL GLSL ES 1.0',
          extensions: [
            'ANGLE_instanced_arrays',
            'EXT_blend_minmax',
            'EXT_color_buffer_half_float',
            'EXT_frag_depth',
            'EXT_shader_texture_lod',
            'EXT_texture_filter_anisotropic',
            'EXT_sRGB',
            'OES_element_index_uint',
            'OES_standard_derivatives',
            'OES_texture_float',
            'OES_texture_float_linear',
            'OES_texture_half_float',
            'OES_texture_half_float_linear',
            'OES_vertex_array_object',
            'WEBGL_color_buffer_float',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_depth_texture',
            'WEBGL_draw_buffers',
            'WEBGL_lose_context'
          ],
          parameters: {
            MAX_VIEWPORT_DIMS: [32767, 32767],
            MAX_TEXTURE_SIZE: 16384,
            MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
            MAX_RENDERBUFFER_SIZE: 16384,
            MAX_VERTEX_ATTRIBS: 16,
            MAX_VARYING_VECTORS: 30,
            MAX_VERTEX_UNIFORM_VECTORS: 4095,
            MAX_FRAGMENT_UNIFORM_VECTORS: 4095
          },
          fingerprint: 'a908f7e6d5c4b32918f7e6d5c4b3a209'
        },
        fonts: {
          available: [
            'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
            'Consolas', 'Courier New', 'Georgia', 'Impact', 'Lucida Console',
            'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
            'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
            'Symbol', 'Wingdings'
          ],
          fingerprint: '8f7e6d5c4b3a29180f7e6d5c4b3a2918'
        },
        audio: {
          fingerprint: '0f9e8d7c6b5a4392810f9e8d7c6b5a43',
          sampleRate: 48000,
          maxChannelCount: 2,
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers'
        },
        hardware: {
          hardwareConcurrency: 8,
          deviceMemory: undefined, // Firefox 不暴露此属性
          maxTouchPoints: 0,
          pointerEvents: true,
          sensors: {
            accelerometer: false,
            gyroscope: false,
            magnetometer: false,
            ambientLightSensor: false,
            geolocation: true
          }
        },
        browser: {
          cookieEnabled: true,
          javaEnabled: false,
          onLine: true,
          pdfViewerEnabled: true,
          vendor: '',
          vendorSub: '',
          productSub: '20100101',
          appCodeName: 'Mozilla',
          appName: 'Netscape',
          appVersion: '5.0 (Windows)',
          buildID: '20100101',
          oscpu: 'Windows NT 10.0; Win64; x64'
        },
        css: {
          supports: {
            'display: flex': true,
            'display: grid': true,
            'transform: rotate(45deg)': true,
            'filter: blur(5px)': true,
            'backdrop-filter: blur(5px)': true,
            'clip-path: circle(50%)': true
          },
          mediaQueries: {
            'prefers-color-scheme: dark': false,
            'prefers-reduced-motion: reduce': false,
            'prefers-contrast: high': false,
            'forced-colors: active': false
          }
        },
        permissions: {
          camera: 'prompt',
          microphone: 'prompt',
          geolocation: 'prompt',
          notifications: 'default'
        },
        deviceId: 'ffx133win_7e6d5c4b3a29180f7e6d5c4b3a291807'
      },

      'safari-17-macos-desktop': {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        screen: {
          width: 2560,
          height: 1440,
          colorDepth: 24,
          pixelDepth: 24,
          availWidth: 2560,
          availHeight: 1385
        },
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        languages: ['en-US', 'en'],
        cookieEnabled: true,
        doNotTrack: 'unspecified',
        canvas: {
          fingerprint: '5d4c3b2a190817f6e5d4c3b2a190876e',
          textMetrics: {
            width: 156.5,
            actualBoundingBoxLeft: 0.4375,
            actualBoundingBoxRight: 156.0625,
            fontBoundingBoxAscent: 14,
            fontBoundingBoxDescent: 4
          },
          imageDataHash: 'c7b6a59483726150fe3d2c1b0a98f7ed'
        },
        webgl: {
          vendor: 'WebKit',
          renderer: 'WebKit WebGL',
          version: 'WebGL 1.0',
          shadingLanguageVersion: 'WebGL GLSL ES 1.0',
          extensions: [
            'ANGLE_instanced_arrays',
            'EXT_blend_minmax',
            'EXT_frag_depth',
            'EXT_shader_texture_lod',
            'EXT_texture_filter_anisotropic',
            'OES_element_index_uint',
            'OES_standard_derivatives',
            'OES_texture_float',
            'OES_texture_float_linear',
            'OES_texture_half_float',
            'OES_texture_half_float_linear',
            'OES_vertex_array_object',
            'WEBGL_color_buffer_float',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_depth_texture',
            'WEBGL_draw_buffers',
            'WEBGL_lose_context'
          ],
          parameters: {
            MAX_VIEWPORT_DIMS: [16384, 16384],
            MAX_TEXTURE_SIZE: 16384,
            MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
            MAX_RENDERBUFFER_SIZE: 16384,
            MAX_VERTEX_ATTRIBS: 16,
            MAX_VARYING_VECTORS: 31,
            MAX_VERTEX_UNIFORM_VECTORS: 1024,
            MAX_FRAGMENT_UNIFORM_VECTORS: 1024
          },
          fingerprint: '908f7e6d5c4b3291807f6e5d4c3b2a19'
        },
        fonts: {
          available: [
            'Helvetica Neue', 'Helvetica', 'Arial', 'Lucida Grande', 'Verdana',
            'Geneva', 'Georgia', 'Times', 'Times New Roman', 'Trebuchet MS',
            'Courier', 'Courier New', 'Palatino', 'Optima', 'Futura',
            'Menlo', 'Monaco', 'Symbol', 'Zapf Dingbats',
            'SF Pro Display', 'SF Pro Text', 'PingFang SC', 'Hiragino Sans'
          ],
          fingerprint: 'f7e6d5c4b3a29180f7e6d5c4b3a29180'
        },
        audio: {
          fingerprint: 'e8d7c6b5a439281fe8d7c6b5a439281f',
          sampleRate: 48000,
          maxChannelCount: 2,
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers'
        },
        hardware: {
          hardwareConcurrency: 10,
          deviceMemory: undefined, // Safari 不暴露此属性
          maxTouchPoints: 0,
          pointerEvents: true,
          sensors: {
            accelerometer: false,
            gyroscope: false,
            magnetometer: false,
            ambientLightSensor: false,
            geolocation: true
          }
        },
        browser: {
          cookieEnabled: true,
          javaEnabled: false,
          onLine: true,
          pdfViewerEnabled: true,
          vendor: 'Apple Computer, Inc.',
          vendorSub: '',
          productSub: '20030107',
          appCodeName: 'Mozilla',
          appName: 'Netscape',
          appVersion: '5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
          buildID: undefined,
          oscpu: undefined
        },
        css: {
          supports: {
            'display: flex': true,
            'display: grid': true,
            'transform: rotate(45deg)': true,
            'filter: blur(5px)': true,
            'backdrop-filter: blur(5px)': true,
            'clip-path: circle(50%)': true
          },
          mediaQueries: {
            'prefers-color-scheme: dark': false,
            'prefers-reduced-motion: reduce': false,
            'prefers-contrast: high': false,
            'forced-colors: active': false
          }
        },
        permissions: {
          geolocation: 'prompt',
          notifications: 'default'
        },
        deviceId: 'saf17mac_6d5c4b3a29180f7e6d5c4b3a29180f7e'
      }
    };
  }

  /**
   * 选择设备配置文件
   */
  selectDeviceProfile(profileName = null) {
    if (profileName && this.deviceProfiles[profileName]) {
      this.currentDeviceProfile = this.deviceProfiles[profileName];
      this.logger.info(`Selected device profile: ${profileName}`);
      return this.currentDeviceProfile;
    }

    // 随机选择一个配置文件
    const profileNames = Object.keys(this.deviceProfiles);
    const randomProfile = profileNames[Math.floor(Math.random() * profileNames.length)];
    this.currentDeviceProfile = this.deviceProfiles[randomProfile];
    this.logger.info(`Randomly selected device profile: ${randomProfile}`);
    
    return this.currentDeviceProfile;
  }

  /**
   * 获取当前设备配置文件
   */
  getCurrentDeviceProfile() {
    if (!this.currentDeviceProfile) {
      return this.selectDeviceProfile();
    }
    return this.currentDeviceProfile;
  }

  /**
   * 生成Canvas指纹
   */
  generateCanvasFingerprint(width = 200, height = 50) {
    const profile = this.getCurrentDeviceProfile();
    
    // 模拟Canvas绘制过程中的硬件差异
    const canvasData = {
      // 文本渲染
      text: {
        content: 'BrowserLeaks,canvas,fingerprint',
        font: '14px Arial',
        fillStyle: 'rgb(255,255,255)',
        strokeStyle: 'rgb(0,0,0)',
        metrics: profile.canvas.textMetrics
      },
      // 图形渲染
      shapes: {
        rectangle: { x: 0, y: 0, width: 100, height: 20 },
        circle: { x: 50, y: 25, radius: 10 },
        gradient: 'linear-gradient(0deg, rgba(255,0,0,1) 0%, rgba(0,255,0,1) 100%)'
      },
      // 像素数据
      imageData: profile.canvas.imageDataHash,
      // 浏览器特定的渲染差异
      browserVariation: this.getBrowserSpecificCanvasVariation(profile)
    };

    const fingerprintString = JSON.stringify(canvasData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex').substring(0, 32);
  }

  /**
   * 获取浏览器特定的Canvas渲染差异
   */
  getBrowserSpecificCanvasVariation(profile) {
    if (profile.userAgent.includes('Chrome')) {
      return {
        antiAliasing: 'high',
        textBaseline: 'alphabetic',
        globalCompositeOperation: 'source-over',
        shadowBlur: 0
      };
    } else if (profile.userAgent.includes('Firefox')) {
      return {
        antiAliasing: 'medium',
        textBaseline: 'alphabetic',
        globalCompositeOperation: 'source-over',
        shadowBlur: 0.1
      };
    } else if (profile.userAgent.includes('Safari')) {
      return {
        antiAliasing: 'high',
        textBaseline: 'alphabetic',
        globalCompositeOperation: 'source-over',
        shadowBlur: 0.05
      };
    }
    return { antiAliasing: 'medium' };
  }

  /**
   * 生成WebGL指纹
   */
  generateWebGLFingerprint() {
    const profile = this.getCurrentDeviceProfile();
    const webgl = profile.webgl;
    
    const webglData = {
      vendor: webgl.vendor,
      renderer: webgl.renderer,
      version: webgl.version,
      shadingLanguageVersion: webgl.shadingLanguageVersion,
      extensions: webgl.extensions.sort(),
      parameters: webgl.parameters,
      // WebGL特定渲染测试
      renderingTests: {
        triangleTest: this.generateTriangleRenderHash(),
        shaderTest: this.generateShaderRenderHash(),
        textureTest: this.generateTextureRenderHash()
      }
    };

    const fingerprintString = JSON.stringify(webglData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex').substring(0, 32);
  }

  /**
   * 生成三角形渲染测试哈希
   */
  generateTriangleRenderHash() {
    // 模拟WebGL三角形渲染的结果差异
    const profile = this.getCurrentDeviceProfile();
    const baseData = `triangle_${profile.webgl.renderer}_${profile.platform}`;
    return crypto.createHash('md5').update(baseData).digest('hex').substring(0, 16);
  }

  /**
   * 生成着色器测试哈希
   */
  generateShaderRenderHash() {
    const profile = this.getCurrentDeviceProfile();
    const baseData = `shader_${profile.webgl.shadingLanguageVersion}_${Date.now()}`;
    return crypto.createHash('md5').update(baseData).digest('hex').substring(0, 16);
  }

  /**
   * 生成纹理测试哈希
   */
  generateTextureRenderHash() {
    const profile = this.getCurrentDeviceProfile();
    const baseData = `texture_${profile.webgl.parameters.MAX_TEXTURE_SIZE}`;
    return crypto.createHash('md5').update(baseData).digest('hex').substring(0, 16);
  }

  /**
   * 生成字体指纹
   */
  generateFontFingerprint() {
    const profile = this.getCurrentDeviceProfile();
    
    // 模拟字体渲染测试
    const fontTests = profile.fonts.available.map(font => {
      return {
        font,
        // 模拟不同字体在不同系统下的渲染差异
        renderData: this.simulateFontRender(font, profile.platform)
      };
    });

    const fontData = {
      availableFonts: profile.fonts.available.sort(),
      renderTests: fontTests,
      platformSpecific: this.getPlatformSpecificFontFeatures(profile.platform)
    };

    const fingerprintString = JSON.stringify(fontData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex').substring(0, 32);
  }

  /**
   * 模拟字体渲染
   */
  simulateFontRender(fontName, platform) {
    const baseString = `${fontName}_${platform}_render_test`;
    return {
      width: 100 + (crypto.createHash('md5').update(baseString).digest('hex').charCodeAt(0) % 50),
      height: 20 + (crypto.createHash('md5').update(baseString).digest('hex').charCodeAt(1) % 10),
      hash: crypto.createHash('md5').update(baseString).digest('hex').substring(0, 8)
    };
  }

  /**
   * 获取平台特定字体特性
   */
  getPlatformSpecificFontFeatures(platform) {
    if (platform.includes('Win')) {
      return {
        cleartype: true,
        fontSmoothing: 'antialiased',
        subpixelRendering: true
      };
    } else if (platform === 'MacIntel') {
      return {
        fontSmoothing: 'subpixel-antialiased',
        retina: true,
        quartzTextRendering: true
      };
    }
    return { fontSmoothing: 'antialiased' };
  }

  /**
   * 生成音频指纹
   */
  generateAudioFingerprint() {
    const profile = this.getCurrentDeviceProfile();
    
    const audioData = {
      audioContext: {
        sampleRate: profile.audio.sampleRate,
        maxChannelCount: profile.audio.maxChannelCount,
        numberOfInputs: profile.audio.numberOfInputs,
        numberOfOutputs: profile.audio.numberOfOutputs,
        channelCount: profile.audio.channelCount,
        channelCountMode: profile.audio.channelCountMode,
        channelInterpretation: profile.audio.channelInterpretation
      },
      // 模拟音频处理差异
      processingVariation: this.simulateAudioProcessing(profile),
      // 音频硬件特征
      hardwareFeatures: {
        audioWorklet: true,
        offlineAudioContext: true,
        webAudioAPI: true
      }
    };

    const fingerprintString = JSON.stringify(audioData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex').substring(0, 32);
  }

  /**
   * 模拟音频处理差异
   */
  simulateAudioProcessing(profile) {
    // 不同设备和浏览器的音频处理会有微小差异
    const baseData = `${profile.platform}_${profile.userAgent}_audio`;
    const hash = crypto.createHash('md5').update(baseData).digest('hex');
    
    return {
      oscillatorVariation: hash.substring(0, 8),
      dynamicsCompressorVariation: hash.substring(8, 16),
      analyserVariation: hash.substring(16, 24)
    };
  }

  /**
   * 生成综合设备指纹
   */
  generateDeviceFingerprint() {
    const profile = this.getCurrentDeviceProfile();
    
    const fingerprints = {
      canvas: this.generateCanvasFingerprint(),
      webgl: this.generateWebGLFingerprint(),
      fonts: this.generateFontFingerprint(),
      audio: this.generateAudioFingerprint(),
      // 基础硬件信息
      hardware: {
        platform: profile.platform,
        hardwareConcurrency: profile.hardware.hardwareConcurrency,
        deviceMemory: profile.hardware.deviceMemory,
        screen: profile.screen,
        timezone: profile.timezone,
        language: profile.language
      },
      // 浏览器特征
      browser: profile.browser,
      // CSS支持
      css: profile.css,
      // 权限状态
      permissions: profile.permissions
    };

    const masterFingerprint = crypto.createHash('sha256')
      .update(JSON.stringify(fingerprints))
      .digest('hex');

    return {
      deviceId: profile.deviceId,
      masterFingerprint,
      components: fingerprints,
      timestamp: Date.now()
    };
  }

  /**
   * 验证指纹一致性
   */
  validateDeviceConsistency(currentFingerprint, sessionId) {
    if (!this.sessionConsistency.has(sessionId)) {
      this.sessionConsistency.set(sessionId, currentFingerprint);
      return true;
    }

    const storedFingerprint = this.sessionConsistency.get(sessionId);
    
    // 检查关键组件是否一致
    const criticalComponents = ['canvas', 'webgl', 'fonts', 'audio'];
    for (const component of criticalComponents) {
      if (storedFingerprint.components[component] !== currentFingerprint.components[component]) {
        this.logger.warn(`Device fingerprint inconsistency detected in ${component}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 生成用于HTTP请求的设备特征头部
   */
  generateDeviceHeaders() {
    const profile = this.getCurrentDeviceProfile();
    
    const headers = {
      'User-Agent': profile.userAgent,
      'Accept-Language': `${profile.language},${profile.languages.join(',')};q=0.9`,
      'Sec-CH-UA-Platform': `"${profile.platform}"`,
      'Sec-CH-UA-Mobile': '?0', // Desktop
      'Viewport-Width': profile.screen.width.toString(),
      'Device-Memory': profile.hardware.deviceMemory?.toString(),
      'Downlink': '10', // 模拟网络速度
      'ECT': '4g', // Effective Connection Type
      'RTT': '50' // Round Trip Time
    };

    // 添加浏览器特定头部
    if (profile.userAgent.includes('Chrome')) {
      headers['Sec-CH-UA'] = '"Not_A Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"';
      headers['Sec-CH-UA-Arch'] = '"x86"';
      headers['Sec-CH-UA-Bitness'] = '"64"';
      headers['Sec-CH-UA-Full-Version'] = '"131.0.6778.85"';
      headers['Sec-CH-UA-Full-Version-List'] = '"Not_A Brand";v="8.0.0.0", "Chromium";v="131.0.6778.85", "Google Chrome";v="131.0.6778.85"';
      headers['Sec-CH-UA-Model'] = '""';
      headers['Sec-CH-UA-Platform-Version'] = '"15.0.0"';
      headers['Sec-CH-UA-WoW64'] = '?0';
    }

    return headers;
  }

  /**
   * 重置设备配置文件
   */
  resetDeviceProfile() {
    this.currentDeviceProfile = null;
    this.sessionConsistency.clear();
    this.logger.info('Device profile reset');
  }

  /**
   * 获取支持的设备配置文件列表
   */
  getSupportedDeviceProfiles() {
    return Object.keys(this.deviceProfiles).map(key => ({
      key,
      name: this.deviceProfiles[key].platform,
      userAgent: this.deviceProfiles[key].userAgent,
      deviceId: this.deviceProfiles[key].deviceId
    }));
  }

  /**
   * 导出当前设备配置（用于调试）
   */
  exportDeviceConfig() {
    const profile = this.getCurrentDeviceProfile();
    const fingerprint = this.generateDeviceFingerprint();
    
    return {
      profile: profile,
      fingerprint: fingerprint,
      headers: this.generateDeviceHeaders()
    };
  }

  /**
   * 设置日志记录器
   */
  setupLogger() {
    return {
      info: (msg, ...args) => console.log(`[Device-Fingerprint] INFO: ${msg}`, ...args),
      debug: (msg, ...args) => console.log(`[Device-Fingerprint] DEBUG: ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[Device-Fingerprint] WARN: ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[Device-Fingerprint] ERROR: ${msg}`, ...args)
    };
  }
}

export default DeviceFingerprint;