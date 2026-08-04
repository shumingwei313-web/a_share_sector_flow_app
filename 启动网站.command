#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="$PROJECT_DIR/.runtime/node-v24.15.0-darwin-arm64/bin/node"

cd "$PROJECT_DIR" || exit 1

if [[ ! -x "$NODE_BIN" ]]; then
  echo "没有找到网站运行环境，请在 Codex 中告诉我：运行环境不存在。"
  read "?按回车键关闭窗口..."
  exit 1
fi

echo "正在启动 情绪之道..."
echo "启动成功后，请打开：http://127.0.0.1:4173"
echo "请保持这个终端窗口开启。按 Control+C 可以停止网站。"
echo

(sleep 1; open "http://127.0.0.1:4173") &
"$NODE_BIN" server.js

echo
read "?网站已停止，按回车键关闭窗口..."
