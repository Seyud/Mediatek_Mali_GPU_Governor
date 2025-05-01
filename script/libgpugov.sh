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



