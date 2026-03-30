// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, theme } from 'antd';
import { SocketProvider } from '@/context/SocketContext';
import AppRoutes from '@/routes';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#7c6af7',
    colorBgBase: '#0b0b10',
    colorBgContainer: '#13131a',
    colorBgElevated: '#1a1a24',
    colorBorder: '#252535',
    colorText: '#e8e8f0',
    colorTextSecondary: '#8888a8',
    borderRadius: 10,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider theme={antdTheme}>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </ConfigProvider>
      </BrowserRouter>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </React.StrictMode>
);
