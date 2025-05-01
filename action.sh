#!/bin/sh
# 游戏模式切换脚本
# 用法: ./toggle_game_mode.sh [on|off]
# 如果不提供参数，则切换当前状态

# 获取脚本所在目录
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
# 加载公共库
. "$SCRIPT_DIR/script/libcommon.sh"

GPU_GOVERNOR_DIR="/data/adb/gpu_governor"
GPU_GOVERNOR_LOG_DIR="$GPU_GOVERNOR_DIR/log"
GAME_MODE_FILE="$GPU_GOVERNOR_DIR/game_mode"
GPU_GOV_LOG_FILE="$GPU_GOVERNOR_LOG_DIR/gpu_gov.log.txt"
MAX_LOG_SIZE_MB=5 # 日志文件最大大小，单位MB

# 确保目录存在并设置适当权限
mkdir -p "$GPU_GOVERNOR_DIR"
mkdir -p "$GPU_GOVERNOR_LOG_DIR"
# 设置目录权限为777，确保任何进程都可以写入
chmod 0777 "$GPU_GOVERNOR_DIR"
chmod 0777 "$GPU_GOVERNOR_LOG_DIR"

# 使用统一的日志轮转函数
rotate_log "$GPU_GOV_LOG_FILE" "$MAX_LOG_SIZE_MB"

# 确保文件存在
if [ ! -f "$GAME_MODE_FILE" ]; then
    echo "0" > "$GAME_MODE_FILE"
    chmod 666 "$GAME_MODE_FILE"
fi

# 获取当前状态
current_mode=$(cat "$GAME_MODE_FILE")

# 根据参数切换状态
if [ "$1" = "on" ]; then
    echo "1" > "$GAME_MODE_FILE"
    echo "游戏模式已开启"
elif [ "$1" = "off" ]; then
    echo "0" > "$GAME_MODE_FILE"
    echo "游戏模式已关闭"
else
    # 切换当前状态
    if [ "$current_mode" = "1" ]; then
        echo "0" > "$GAME_MODE_FILE"
        echo "游戏模式已关闭"
    else
        echo "1" > "$GAME_MODE_FILE"
        echo "游戏模式已开启"
    fi
fi
