/* eslint-disable @typescript-eslint/no-explicit-any */
// CORS 繞過工具函式

// 方法 1: 使用代理服務器 (僅限開發環境)
export const getProxiedUrl = (originalUrl: string): string => {
  if (import.meta.env.DEV) {
    // 開發環境使用 Vite 代理
    return originalUrl.replace(/^https?:\/\/[^\\/]+/, "/api");
  }
  return originalUrl;
};

// 方法 2: 創建無 CORS 限制的請求函式
export const createNoCorsRequest = () => {
  const originalFetch = window.fetch;
  
  return function noCordFetch(url: string, options: RequestInit = {}) {
    // 在生產環境中，可以使用公共 CORS 代理服務
    if (!import.meta.env.DEV && url.startsWith('http')) {
      // 選項 1: 使用公共 CORS 代理 (不建議在生產環境使用)
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      
      // 選項 2: 使用自己的 CORS 代理服務
      // const proxyUrl = `https://your-cors-proxy.com/proxy?url=${encodeURIComponent(url)}`;
      
      return originalFetch(proxyUrl, {
        ...options,
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    }
    
    return originalFetch(url, options);
  };
};

// 方法 3: 動態創建 script 標籤進行 JSONP 請求 (僅限 GET)
export const jsonpRequest = (url: string, callbackName?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callback = callbackName || `jsonp_callback_${Date.now()}`;
    
    // 設置全局回調函式
    (window as any)[callback] = (data: any) => {
      document.body.removeChild(script);
      delete (window as any)[callback];
      resolve(data);
    };
    
    script.onerror = () => {
      document.body.removeChild(script);
      delete (window as any)[callback];
      reject(new Error('JSONP request failed'));
    };
    
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callback}`;
    document.body.appendChild(script);
  });
};

// 方法 4: 使用 iframe 進行跨域通信 (需要目標服務器配合)
export const createIframeProxy = (targetOrigin: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `${targetOrigin}/cors-proxy.html`; // 需要目標服務器提供此頁面
  document.body.appendChild(iframe);
  
  return {
    postMessage: (data: any) => {
      iframe.contentWindow?.postMessage(data, targetOrigin);
    },
    onMessage: (callback: (data: any) => void) => {
      window.addEventListener('message', (event) => {
        if (event.origin === targetOrigin) {
          callback(event.data);
        }
      });
    },
    destroy: () => {
      document.body.removeChild(iframe);
    },
  };
};

// 方法 5: 瀏覽器擴展/插件方式 (需要用戶安裝)
export const browserExtensionInstructions = `
如果需要完全繞過 CORS 限制，用戶可以：

1. 安裝瀏覽器擴展如 "CORS Unblock" 或 "Disable CORS"
2. 使用開發者模式啟動 Chrome：
   chrome.exe --user-data-dir=/tmp/chrome_temp --disable-web-security --disable-features=VizDisplayCompositor

3. 使用 Firefox 的 about:config 設置：
   security.fileuri.strict_origin_policy = false
`;

export default {
  getProxiedUrl,
  createNoCorsRequest,
  jsonpRequest,
  createIframeProxy,
  browserExtensionInstructions,
};
