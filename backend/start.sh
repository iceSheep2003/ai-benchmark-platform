#!/usr/bin/env bash
# ============================================================
# AI Benchmark Platform - Backend Startup Script
# ============================================================
# 启动 FastAPI 后端服务，端口 8711
#
# 用法:
#   chmod +x backend/start.sh
#   ./backend/start.sh              # 默认启动
#   ./backend/start.sh --reload     # 开发模式（代码变更自动重载）
#
# 环境变量:
#   OPENCOMPASS_ROOT  - opencompass 项目根目录
#                       默认: 项目内的 opencompass 目录
#   HOST              - 监听地址，默认 0.0.0.0
#   PORT              - 监听端口，默认 8711
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- 默认环境变量 ---
export OPENCOMPASS_ROOT="${OPENCOMPASS_ROOT:-$(cd "$PROJECT_ROOT/opencompass" 2>/dev/null && pwd || echo "")}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8711}"

# --- 检查 ---
if [ -z "$OPENCOMPASS_ROOT" ] || [ ! -d "$OPENCOMPASS_ROOT" ]; then
    echo "[ERROR] OPENCOMPASS_ROOT 未设置或目录不存在: $OPENCOMPASS_ROOT"
    echo "        请设置环境变量: export OPENCOMPASS_ROOT=/path/to/opencompass"
    exit 1
fi

echo "============================================"
echo "  AI Benchmark Platform - Backend Service"
echo "============================================"
echo "  项目根目录:     $PROJECT_ROOT"
echo "  后端目录:       $SCRIPT_DIR"
echo "  OpenCompass:    $OPENCOMPASS_ROOT"
echo "  监听地址:       $HOST:$PORT"
echo "============================================"

# --- 安装依赖（如果需要） ---
if ! python -c "import fastapi" 2>/dev/null; then
    echo "[INFO] 正在安装后端依赖..."
    pip install -r "$SCRIPT_DIR/requirements.txt" -q
fi

# --- 启动 ---
EXTRA_ARGS=""
if [[ "${1:-}" == "--reload" ]]; then
    EXTRA_ARGS="--reload"
    echo "[INFO] 开发模式：启用代码自动重载"
fi

cd "$PROJECT_ROOT"

exec python -m uvicorn backend.app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    $EXTRA_ARGS
