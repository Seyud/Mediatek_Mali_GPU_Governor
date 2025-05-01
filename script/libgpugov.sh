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
GPUGOV_LOGPATH="$LOG_PATH/gpu_gov.log.txt"
MAX_LOG_SIZE_MB=5 # 日志文件最大大小，单位MB

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
        log "日志文件大小($file_size 字节)超过限制($max_size_bytes 字节)，进行轮转"

        # 创建备份文件（如果已存在则覆盖）
        cp "$log_file" "${log_file}.bak"

        # 清空原日志文件
        true > "$log_file"

        # 记录轮转信息
        echo "$(date) - 日志已轮转，原日志已备份到 ${log_file}.bak" >> "$log_file"
        sync
    fi
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

    # 检查并轮转主日志文件
    check_and_rotate_log "$GPUGOV_LOGPATH"

    log "Starting gpu governor"
    sync
    nohup "$BIN_PATH/gpugovernor" 2>&1 &
    sync

    sleep 2
    if ! pgrep -f "gpugovernor" >/dev/null; then
        log "Error: Process failed to start"
        return 1
    fi

    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    log "GPU Governor started successfully"
}
gpugov_testconf() {
    log "Starting gpu governor"

    # 检查并轮转主日志文件
    check_and_rotate_log "$GPUGOV_LOGPATH"

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
    gpugov_start
}



