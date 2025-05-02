#!/system/bin/sh

# 使用更可靠的方式获取脚本目录
MODDIR=${0%/*}
if [ "$MODDIR" = "$0" ]; then
    MODDIR=$(pwd)
fi

# 确定脚本所在目录
SCRIPT_DIR="$MODDIR"
# 如果当前脚本在script目录下，则模块目录是其父目录
if [ "$(basename "$SCRIPT_DIR")" = "script" ]; then
    MODULE_DIR="$(dirname "$SCRIPT_DIR")"
else
    # 否则假设模块目录就是当前目录，script是其子目录
    MODULE_DIR="$SCRIPT_DIR"
    SCRIPT_DIR="$MODULE_DIR/script"
fi

# 创建初始化日志目录
mkdir -p /data/adb/gpu_governor/log 2>/dev/null
INIT_LOG="/data/adb/gpu_governor/log/initsvc.log"

# 记录目录信息到初始化日志
echo "$(date) - 初始化开始" >> "$INIT_LOG"
echo "SCRIPT_DIR=$SCRIPT_DIR" >> "$INIT_LOG"
echo "MODULE_DIR=$MODULE_DIR" >> "$INIT_LOG"

# 确保路径信息正确加载
if [ -f "$SCRIPT_DIR/pathinfo.sh" ]; then
    . "$SCRIPT_DIR/pathinfo.sh"
    echo "已成功加载 pathinfo.sh" >> "$INIT_LOG"
else
    # 尝试其他可能的位置
    if [ -f "$MODULE_DIR/script/pathinfo.sh" ]; then
        . "$MODULE_DIR/script/pathinfo.sh"
        echo "已从 module/script 成功加载 pathinfo.sh" >> "$INIT_LOG"
    else
        # 由于pathinfo.sh未加载，log函数不可用，直接写入初始化日志
        echo "错误: pathinfo.sh 未在 $SCRIPT_DIR 或 $MODULE_DIR/script 中找到" >> "$INIT_LOG"
        exit 1
    fi
fi

# 现在可以使用log函数了
log "初始化服务开始运行"
log "SCRIPT_DIR=$SCRIPT_DIR"
log "MODULE_DIR=$MODULE_DIR"

# 加载其他库
if [ -f "$SCRIPT_DIR/libcommon.sh" ]; then
    . "$SCRIPT_DIR/libcommon.sh"
    log "已加载 libcommon.sh"
else
    log "错误: libcommon.sh 未找到，路径: $SCRIPT_DIR"
    exit 1
fi

if [ -f "$SCRIPT_DIR/libgpugov.sh" ]; then
    . "$SCRIPT_DIR/libgpugov.sh"
    log "已加载 libgpugov.sh"
else
    log "错误: libgpugov.sh 未找到，路径: $SCRIPT_DIR"
    exit 1
fi

# 设置日志文件最大大小（单位MB）
MAX_LOG_SIZE_MB=5

# 等待系统启动完成
wait_until_login

# 确保日志目录存在并设置适当权限
mkdir -p "$LOG_PATH" 2>/dev/null
mkdir -p "$GAMES_PATH" 2>/dev/null

# 设置日志目录权限为777，确保任何进程都可以写入
chmod 0777 "$LOG_PATH" 2>/dev/null
chmod 0777 "$GAMES_PATH" 2>/dev/null

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0666 "$LOG_LEVEL_FILE"
    log "Created log level file with default level: info"
fi

# 检查并轮转所有日志文件
# 先处理主日志文件
if [ -f "$GPUGOV_LOGPATH" ]; then
    # 强制轮转主日志文件，确保启动时日志文件不会太大
    cp "$GPUGOV_LOGPATH" "${GPUGOV_LOGPATH}.bak" 2>/dev/null
    true > "$GPUGOV_LOGPATH"
    chmod 0666 "$GPUGOV_LOGPATH"
    echo "$(date) - 系统启动时强制轮转日志，原日志已备份到 ${GPUGOV_LOGPATH}.bak" >> "$GPUGOV_LOGPATH"
    sync
fi

# 使用统一的日志轮转函数处理初始化日志
rotate_log "$LOG_FILE" "$MAX_LOG_SIZE_MB"

# 记录基本信息到日志
{
    echo "$(date)"
    echo "PATH=$PATH"
    echo "sh=$(which sh)"
    echo "Bootstraping MTK_GPU_GOVERNOR"

    # 记录当前日志等级
    if [ -f "$LOG_LEVEL_FILE" ]; then
        current_log_level=$(cat "$LOG_LEVEL_FILE")
        echo "Current log level: $current_log_level"

        # 确保在debug模式下也创建初始化日志
        if [ "$current_log_level" = "debug" ]; then
            echo "Debug mode enabled, ensuring initialization log is created"
        fi
    else
        echo "Log level file not found, using default: info"
    fi

    # 确保日志文件权限正确
    chmod 0666 "$LOG_FILE" 2>/dev/null
} >> "$LOG_FILE"
sync

# 内联gpugov_testconf函数的内容，避免函数调用问题
{
    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    echo "Starting gpu governor"

    # 检查用户配置文件
    if [ -f "$USER_PATH/gpu_freq_table.conf" ]; then
        echo "Found user config at $USER_PATH/gpu_freq_table.conf"
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    else
        # 获取设备平台信息
        target="$(getprop ro.board.platform)"
        cfgname="$(get_config_name $target)"

        if [ "$cfgname" = "unsupported" ]; then
            target="$(getprop ro.product.board)"
            cfgname="$(get_config_name "$target")"
        fi

        # 如果平台支持，使用平台特定配置，否则使用默认配置
        if [ "$cfgname" != "unsupported" ] && [ -f "$MODULE_PATH/config/$cfgname.conf" ]; then
            cp -f "$MODULE_PATH/config/$cfgname.conf" "$USER_PATH/gpu_freq_table.conf"
            echo "Created platform-specific config from $cfgname.conf"
        else
            cp -f "$MODULE_PATH/gpu_freq_table.conf" "$USER_PATH/gpu_freq_table.conf"
            echo "Created default config from gpu_freq_table.conf"
        fi
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    fi

    echo "Using config $GPUGOV_CONFPATH"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    # 启动GPU调速器
    # 直接使用 BIN_PATH
    if [ ! -x "$BIN_PATH/gpugovernor" ]; then
        echo "Error: Binary not executable, trying to fix permissions"
        chmod 0755 "$BIN_PATH/gpugovernor"
        if [ ! -x "$BIN_PATH/gpugovernor" ]; then
            echo "Error: Failed to set executable permission"
            exit 1
        fi
    fi

    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    echo "Starting gpu governor"
    sync

    # 读取日志等级设置
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
        echo "Log level set to: $log_level"
    else
        echo "Log level file not found, using default: info"
    fi

    # 根据日志等级决定是否启用调试输出
    if [ "$log_level" = "debug" ]; then
        echo "Debug level enabled, console output will be shown"
        # 启动进程，确保日志记录正常工作
        echo "Starting gpugovernor with debug level"
        # 确保日志目录和文件权限正确
        chmod -R 0777 "$LOG_PATH" 2>/dev/null
        nohup  "$BIN_PATH/"gpugovernor  2>&1 &

    else
        echo "Using log level: $log_level"
        # 启动进程
        nohup "$BIN_PATH"/gpugovernor 2>&1 &
    fi
    sync

    sleep 2
    if ! pgrep -f "gpugovernor" >/dev/null; then
        echo "Error: Process failed to start"
        exit 1
    fi

    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    echo "GPU Governor started successfully"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
} >> "$LOG_FILE" 2>&1

# 检查并轮转GPU调速器主日志
rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
