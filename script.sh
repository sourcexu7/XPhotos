#!/bin/sh

# 直接使用 node_modules 中的 prisma（Docker 构建阶段已经安装），避免运行时 npx 下载
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma db seed

# Next.js standalone 模式：限制为单进程运行，避免验证码在多进程下状态不一致
# 使用单个 worker 确保所有请求路由到同一进程，内存存储一致
# 如需启用多进程，请确保正确配置 Redis（REDIS_URL 环境变量）
export NODE_ENV=production

# 检查是否配置了 Redis
if [ -n "$REDIS_URL" ] && [ "$REDIS_DISABLED" != "true" ]; then
    echo "[Startup] Redis configured, enabling multi-process mode (workers=$(( $(nproc) > 2 ? 2 : $(nproc) )))"
    # 配置了 Redis：可以使用多进程，最多 2 个 worker 避免资源浪费
    export NEXT_PRIVATE_WORKER_COUNT=$(( $(nproc) > 2 ? 2 : $(nproc) ))
else
    echo "[Startup] Redis not configured, forcing single-process mode for captcha consistency"
    # 未配置 Redis：强制单进程，确保验证码内存存储状态一致
    export NEXT_PRIVATE_WORKER_COUNT=1
fi

HOSTNAME="0.0.0.0" node server.js
