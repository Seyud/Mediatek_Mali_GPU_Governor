#!/bin/sh
# 游戏模式切换脚本
# 用法: ./toggle_game_mode.sh [on|off]
# 如果不提供参数，则切换当前状态

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

# 检查日志文件大小并在必要时进行轮转
check_and_rotate_log() {
    local log_file="$1"
    local max_size_bytes=$((MAX_LOG_SIZE_MB * 1024 * 1024))

    # 确保日志文件存在
    if [ ! -f "$log_file" ]; then
        touch "$log_file"
        chmod 0666 "$log_file"
        return
    fi

    # 获取文件大小（以字节为单位）
    local file_size=$(stat -c %s "$log_file" 2>/dev/null || stat -f %z "$log_file" 2>/dev/null)

    # 如果文件大小超过限制，进行轮转
    if [ "$file_size" -gt "$max_size_bytes" ]; then
        echo "日志文件大小($file_size 字节)超过限制($max_size_bytes 字节)，进行轮转"

        # 创建备份文件（如果已存在则覆盖）
        cp "$log_file" "${log_file}.bak"

        # 清空原日志文件
        true > "$log_file"

        # 记录轮转信息
        echo "$(date) - 日志已轮转，原日志已备份到 ${log_file}.bak" >> "$log_file"
        sync
    fi
}

# 检查并轮转主日志文件
check_and_rotate_log "$GPU_GOV_LOG_FILE"

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
