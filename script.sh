#!/bin/sh

# 直接使用 node_modules 中的 prisma（Docker 构建阶段已经安装），避免运行时 npx 下载
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma db seed

# Next.js standalone 模式：server.js 在 COPY --from=builder .next/standalone ./ 后位于根目录
HOSTNAME="0.0.0.0" node server.js
