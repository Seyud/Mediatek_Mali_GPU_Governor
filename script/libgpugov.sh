#!/vendor/bin/sh
# GPU Governor
# Author: HamJin @CoolApk

BASEDIR="$(dirname "$0")"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh
. $BASEDIR/libpowercfg.sh
. $BASEDIR/libcgroup.sh
. $BASEDIR/libsysinfo.sh

GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
GPUGOV_LOGPATH="$LOG_PATH/gpu_gov.log"
LOG_LEVEL_FILE="$GAMES_PATH/log_level"
MAX_LOG_SIZE_MB=5 # 日志文件最大大小，单位MB

# 使用libcommon.sh中的统一日志轮转函数
# 此函数保留用于向后兼容，实际调用统一的rotate_log函数
check_and_rotate_log() {
    local log_file="$1"
    rotate_log "$log_file" "$MAX_LOG_SIZE_MB"
}

gpugov_start() {
    # 直接使用 BIN_PATH
    if [ ! -x "$BIN_PATH/gpugovernor" ]; then
        log "Error: Binary not executable, trying to fix permissions"
        chmod 0755 "$BIN_PATH/gpugovernor"
        if [ ! -x "$BIN_PATH/gpugovernor" ]; then
            log "Error: Failed to set executable permission"
            return 1
        fi
    fi

    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    log "Starting gpu governor"
    sync

    # 读取日志等级设置
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
        log "Log level set to: $log_level"
    else
        log "Log level file not found, using default: info"
    fi

    # 根据日志等级决定是否启用调试输出
    if [ "$log_level" = "debug" ]; then
        log "Debug level enabled, console output will be shown"
        # 启动进程并设置环境变量，不重定向输出（程序内部已有日志记录）
        nohup env GPU_GOV_DEBUG=1 GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >/dev/null 2>&1 &
    else
        log "Using log level: $log_level"
        # 启动进程，不重定向输出（程序内部已有日志记录）
        nohup env GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >/dev/null 2>&1 &
    fi
    sync

    sleep 2
    if ! pgrep -f "gpugovernor" >/dev/null; then
        log "Error: Process failed to start"
        return 1
    fi

    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    log "GPU Governor started successfully"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
}
gpugov_testconf() {
    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    log "Starting gpu governor"

    # 检查用户配置文件
    if [ -f "$USER_PATH/gpu_freq_table.conf" ]; then
        log "Found user config at $USER_PATH/gpu_freq_table.conf"
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
            log "Created platform-specific config from $cfgname.conf"
        else
            cp -f "$MODULE_PATH/gpu_freq_table.conf" "$USER_PATH/gpu_freq_table.conf"
            log "Created default config from gpu_freq_table.conf"
        fi
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    fi

    log "Using config $GPUGOV_CONFPATH"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    # 启动GPU调速器
    gpugov_start
}



