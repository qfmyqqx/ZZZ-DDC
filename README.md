<div align="center">

# ZZZ-DDC

</div>

绝区零驱动盘抽取强化后提升概率计算器

## 技术栈

- **Vite** — 构建工具，开发热更新，生产打包
- **Tailwind CSS v4** — 原子化 CSS 样式
- **Cloudflare Workers** — 静态部署托管

## 使用

```bash
pnpm install # 安装依赖
pnpm dev      # 启动开发服务器（热更新）
pnpm build    # 构建生产版本到 dist/
pnpm preview # 本地预览构建结果
```

## 项目结构

```
ZZZ-DDC/
├── index.html            # Vite 入口 HTML
├── package.json          # 项目配置、脚本
├── vite.config.js        # Vite 构建配置
├── wrangler.jsonc        # Cloudflare Workers 部署配置
├── pnpm-lock.yaml        # 依赖锁文件
├── .gitignore
├── LICENSE
├── public/               # 静态资源
│   ├── images/           # 角色头像（55个角色）
├── src/
│   ├── main.js           # UI 逻辑、事件绑定
│   ├── calculator.js     # 概率计算核心算法
│   ├── data.js           # 常量、角色数据、词条配置
│   └── style.css         # 全部样式（Tailwind CSS v4）
└── dist/                 # 构建输出（自动生成）
```