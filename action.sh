#!/bin/sh
# 游戏模式切换脚本
# 用法: ./toggle_game_mode.sh [on|off]
# 如果不提供参数，则切换当前状态
# 日志等级设置: ./action.sh log_level [debug|info|warn|error]

# 获取脚本所在目录
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
# 加载公共库
. "$SCRIPT_DIR/script/libcommon.sh"

GPU_GOVERNOR_DIR="/data/adb/gpu_governor"
GPU_GOVERNOR_LOG_DIR="$GPU_GOVERNOR_DIR/log"
GAME_MODE_FILE="$GPU_GOVERNOR_DIR/game_mode"
LOG_LEVEL_FILE="$GPU_GOVERNOR_DIR/log_level"
GPU_GOV_LOG_FILE="$GPU_GOVERNOR_LOG_DIR/gpu_gov.log"
MAX_LOG_SIZE_MB=5 # 日志文件最大大小，单位MB

# 确保目录存在并设置适当权限
mkdir -p "$GPU_GOVERNOR_DIR"
mkdir -p "$GPU_GOVERNOR_LOG_DIR"
# 设置目录权限为777，确保任何进程都可以写入
chmod 0777 "$GPU_GOVERNOR_DIR"
chmod 0777 "$GPU_GOVERNOR_LOG_DIR"

# 检查主日志文件大小并进行轮转
# 使用更积极的轮转策略，确保日志文件不会过大
if [ -f "$GPU_GOV_LOG_FILE" ]; then
    # 获取文件大小（以字节为单位）
    file_size=$(stat -c %s "$GPU_GOV_LOG_FILE" 2>/dev/null || stat -f %z "$GPU_GOV_LOG_FILE" 2>/dev/null)
    max_size_bytes=$((MAX_LOG_SIZE_MB * 1024 * 1024))
    threshold_bytes=$(( (max_size_bytes * 7) / 10 )) # 设置为70%的阈值，更积极地轮转

    # 如果文件大小超过阈值，强制轮转
    if [ -z "$file_size" ] || [ "$file_size" -gt "$threshold_bytes" ]; then
        echo "日志文件大小($file_size 字节)接近或超过阈值($threshold_bytes 字节)，进行轮转"
        cp "$GPU_GOV_LOG_FILE" "${GPU_GOV_LOG_FILE}.bak" 2>/dev/null
        true > "$GPU_GOV_LOG_FILE"
        chmod 0666 "$GPU_GOV_LOG_FILE"
        echo "$(date) - 由action.sh触发的日志轮转，原日志已备份到 ${GPU_GOV_LOG_FILE}.bak" >> "$GPU_GOV_LOG_FILE"
        sync
    fi
fi

# 使用统一的日志轮转函数（作为备份机制）
rotate_log "$GPU_GOV_LOG_FILE" "$MAX_LOG_SIZE_MB"

# 确保文件存在
if [ ! -f "$GAME_MODE_FILE" ]; then
    echo "0" > "$GAME_MODE_FILE"
    chmod 666 "$GAME_MODE_FILE"
fi

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 666 "$LOG_LEVEL_FILE"
fi

# 处理日志等级设置
if [ "$1" = "log_level" ]; then
    if [ "$2" = "debug" ] || [ "$2" = "info" ] || [ "$2" = "warn" ] || [ "$2" = "error" ]; then
        echo "$2" > "$LOG_LEVEL_FILE"
        echo "日志等级已设置为: $2"
        # 通知用户需要重启模块以应用更改
        echo "请重启模块或设备以应用新的日志等级设置"
        exit 0
    else
        # 显示当前日志等级和可用选项
        current_level=$(cat "$LOG_LEVEL_FILE")
        echo "当前日志等级: $current_level"
        echo "可用的日志等级选项: debug, info, warn, error"
        echo "用法: ./action.sh log_level [debug|info|warn|error]"
        exit 0
    fi
fi

# 获取当前游戏模式状态
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
