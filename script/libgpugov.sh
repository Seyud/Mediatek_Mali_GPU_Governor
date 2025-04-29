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
    mv "$GPUGOV_LOGPATH" "$GPUGOV_LOGPATH".bak
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
    if [ -f "$USER_PATH/gpu_freq_table.conf" ]; then
        log "Found $USER_PATH/gpu_freq_table.conf"
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    else
        log "Error: Not Found any config, please check environment"
        exit -1
    fi
    log "Using config $GPUGOV_CONFPATH"
    gpugov_start
}
