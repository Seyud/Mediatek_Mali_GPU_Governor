#!/system/bin/sh

BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh

# 设置日志文件最大大小（单位MB）
MAX_LOG_SIZE_MB=5

. $BASEDIR/libgpugov.sh

wait_until_login

# 确保日志目录存在并设置适当权限
mkdir -p $LOG_PATH
mkdir -p $GAMES_PATH
# 设置日志目录权限为777，确保任何进程都可以写入
chmod 0777 $LOG_PATH
chmod 0777 $GAMES_PATH

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
    else
        echo "Log level file not found, using default: info"
    fi
} >> "$LOG_FILE"

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
        # 启动进程并设置环境变量，不重定向输出（程序内部已有日志记录）
        nohup env GPU_GOV_DEBUG=1 GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >/dev/null 2>&1 &
    else
        echo "Using log level: $log_level"
        # 启动进程，不重定向输出（程序内部已有日志记录）
        nohup env GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >/dev/null 2>&1 &
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
