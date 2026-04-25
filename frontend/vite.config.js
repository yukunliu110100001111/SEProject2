import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 只要请求路径以 /api 开头，就转发到后端服务器
      '/api': {
        target: 'http://localhost:8080', // 假设你后端跑在 8080
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 转发时去掉 /api 前缀
      },
      // 图片上传后返回的是 /uploads/...，开发环境下也需要代理到后端
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
