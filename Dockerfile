# syntax=docker/dockerfile:1

FROM node:20.18-alpine3.20 AS base

# 统一使用国内镜像源（可通过 --build-arg 覆盖）
ARG NPM_REGISTRY="https://registry.npmmirror.com"
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

# Install dependencies only when needed
FROM base AS deps

# Alpine 下依赖 libc6-compat 以兼容部分 node 原生模块
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 仅复制安装依赖必需的文件，充分利用 build cache
COPY package.json pnpm-lock.yaml* .npmrc ./

# 使用双引号而不是反引号；反引号在 POSIX shell 中表示命令替换
# 1. 配置 npm registry 加速
# 2. 全局安装 pnpm@9.7.1（与 packageManager 字段一致）
# 3. 给 pnpm 也设置同样的 registry
# 4. 执行项目依赖安装，--no-frozen-lockfile 允许 lockfile 与 package.json 轻微不一致
RUN npm config set registry "${NPM_REGISTRY}" \
    && npm install -g pnpm@9.7.1 \
    && pnpm config set registry "${NPM_REGISTRY}" \
    && pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# 复用 deps 阶段已安装的 node_modules，避免重复 install
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 创建构建所需的临时 .env（Prisma generate 需要 DATABASE_URL 占位）
RUN echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xphotos?schema=public" > .env

# 给 builder 也装 pnpm，保证 prisma:generate / build 可用
RUN npm config set registry "${NPM_CONFIG_REGISTRY}" \
    && npm install -g pnpm@9.7.1 \
    && pnpm config set registry "${NPM_CONFIG_REGISTRY}" \
    && pnpm run prisma:generate \
    && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 依赖：复用 deps 阶段产物
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 静态资源与 prisma schema、启动脚本
COPY --from=builder /app/public ./public
COPY ./prisma ./prisma
COPY ./script.sh ./script.sh

RUN chmod +x script.sh \
    && mkdir .next \
    && chown nextjs:nodejs .next

# Next.js standalone 产物（next.config.mjs 中 output: 'standalone'）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODEJS_HELPERS=0

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./script.sh"]
