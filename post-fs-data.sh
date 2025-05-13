#!/system/bin/sh

MODDIR=${0%/*}

do_others() {
    # 创建日志目录
    mkdir -p /data/adb/gpu_governor/log 2>/dev/null
    LOG_FILE="/data/adb/gpu_governor/log/initsvc.log"

    # 记录操作到日志
    echo "$(date) - post-fs-data.sh: Execution started" >> "$LOG_FILE"

    if [ -f $MODDIR/USE_DEBUGFS ];then
        mount -t debugfs none /sys/kernel/debug
        echo "$(date) - post-fs-data.sh: Debugfs mounted" >> "$LOG_FILE"
    fi

    DVFS=/proc/mali/dvfs_enable
    if [ -f $DVFS ];then
        # 读取当前DVFS状态
        dvfs_status=$(cat $DVFS | cut -f2 -d ' ')
        echo "$(date) - post-fs-data.sh: Current DVFS status=$dvfs_status" >> "$LOG_FILE"

        # 关闭DVFS
        echo 0 > $DVFS

        # 确认DVFS已关闭
        new_status=$(cat $DVFS | cut -f2 -d ' ')
        if [[ "$new_status" == "0" ]]; then
            echo "$(date) - post-fs-data.sh: DVFS successfully disabled" >> "$LOG_FILE"
        else
            echo "$(date) - post-fs-data.sh: Error: Failed to disable DVFS, current status is still $new_status" >> "$LOG_FILE"
        fi
    else
        echo "$(date) - post-fs-data.sh: DVFS file does not exist: $DVFS" >> "$LOG_FILE"
    fi
}
do_others
