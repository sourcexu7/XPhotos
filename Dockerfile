# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# base: 所有阶段共享的基础镜像（Node 20 + Alpine 3.20
# ---------------------------------------------------------------------------
FROM node:20.18-alpine3.20 AS base

# 默认使用国内镜像源，可通过 --build-arg 覆盖
# 注意：ARG / ENV 都放在 FROM 之后声明，保证每个阶段都能拿到
ENV NPM_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

# ---------------------------------------------------------------------------
# deps: 安装项目依赖（独立阶段
# ---------------------------------------------------------------------------
FROM base AS deps

# Alpine 下部分 Node 原生模块需要 libc6-compat 以正常工作（例如 sharp / node-gyp 产出的二进制
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 仅复制与依赖解析所需的文件，最大化利用 build cache
COPY package.json pnpm-lock.yaml* .npmrc ./

# 1) 配置 npm registry
# 2) 全局安装与项目 packageManager 一致的 pnpm@9.7.1
# 3) 配置 pnpm registry
# 4) 安装项目依赖（--no-frozen-lockfile 允许 lockfile 与 package.json 有轻微差异时也能安装
RUN npm config set registry "${NPM_CONFIG_REGISTRY}" \
    && npm install -g pnpm@9.7.1 \
    && pnpm config set registry "${NPM_CONFIG_REGISTRY}" \
    && pnpm install --no-frozen-lockfile

# ---------------------------------------------------------------------------
# builder: 生成 Prisma client 并执行 Next.js build
# ---------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# 复用 deps 阶段已经装好的 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate 需要一个 DATABASE_URL（只在构建期读取 schema；真实连接在运行时注入
RUN echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xphotos?schema=public" > .env

# Prisma engine 镜像：解决国内下载 query-engine 二进制超时/403 的问题
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Next.js build 阶段容易 OOM，把堆内存上限放宽到 4 GiB
ENV NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=4096"

# 给 builder 也装一下 pnpm（deps 阶段装的是全局，本阶段也需要
# 独立步骤：失败时可直接定位到具体哪一步
RUN npm config set registry "${NPM_CONFIG_REGISTRY}" \
    && npm install -g pnpm@9.7.1 \
    && pnpm config set registry "${NPM_CONFIG_REGISTRY}"

# 独立执行：Prisma generate（独立步骤，失败时直接定位
RUN pnpm run prisma:generate

# 独立步骤：Next.js build（独立步骤，失败时直接定位
RUN pnpm run build

# ---------------------------------------------------------------------------
# runner: 最终运行镜像（仅运行时依赖 + standalone 产物
# ---------------------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 依赖：从 deps 拷贝 node_modules（包含 prisma client 等运行时依赖
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 静态资源与 prisma schema、启动脚本
COPY --from=builder /app/public ./public
COPY ./prisma ./prisma
COPY ./script.sh ./script.sh

RUN chmod +x script.sh \
    && mkdir .next \
    && chown nextjs:nodejs .next

# Next.js standalone 产物（需要 next.config.mjs 中 output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODEJS_HELPERS=0
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["./script.sh"]
