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



gpugov_stop() {
    pkill Mediatek_Mali_GPU_Governor
    killall -9 Mediatek_Mali_GPU_Governor
    killall -15 Mediatek_Mali_GPU_Governor
}
gpugov_start() {
    gpugov_stop
    log "Starting gpu governor"
    #lock_val "99" /sys/kernel/ged/hal/custom_boost_gpu_freq
    #lock_val "0" /sys/kernel/ged/hal/custom_upbound_gpu_freq
    # 确保日志目录存在并有适当权限
    mkdir -p "$LOG_PATH"
    chmod 0777 "$LOG_PATH"

    # 备份旧日志文件
    if [ -f "$GPUGOV_LOGPATH" ]; then
        mv "$GPUGOV_LOGPATH" "$GPUGOV_LOGPATH".bak
    fi

    # 创建空日志文件并设置权限
    touch "$GPUGOV_LOGPATH"
    chmod 0666 "$GPUGOV_LOGPATH"

    sync
    nohup "$BIN_PATH"/Mediatek_Mali_GPU_Governor 2>&1 &
    sync
    # waiting for initialization
    sleep 2
    # it shouldn't preempt foreground tasks
    rebuild_process_scan_cache
    change_task_cgroup "Mediatek_Mali_GPU_Governor" "background" "cpuset"
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

