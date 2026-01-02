#!/usr/bin/env sh
# Code Gate Hook Loader
# 智能探测并执行 code-gate hook 命令
# 优先级: 本地安装 -> 全局安装 -> npx 缓存 -> npx 下载

if [ -f "./node_modules/.bin/code-gate" ]; then
  exec ./node_modules/.bin/code-gate hook "$@"
elif command -v code-gate >/dev/null 2>&1; then
  exec code-gate hook "$@"
else
  exec npx --no-install code-gate hook "$@" || exec npx code-gate hook "$@"
fi
