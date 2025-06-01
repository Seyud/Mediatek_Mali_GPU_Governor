#!/system/bin/sh

MODDIR=${0%/*}

do_others() {
    # 创建日志目录
    mkdir -p /data/adb/gpu_governor/log 2>/dev/null

    # 记录操作
    echo "post-fs-data.sh: Execution started"

    if [ -f $MODDIR/USE_DEBUGFS ]; then
        mount -t debugfs none /sys/kernel/debug
        echo "post-fs-data.sh: Debugfs mounted"
    fi

    DVFS=/proc/mali/dvfs_enable
    if [ -f "$DVFS" ]; then
        # 读取当前DVFS状态
        dvfs_status=$(cat "$DVFS" 2>/dev/null | cut -f2 -d ' ')
        echo "post-fs-data.sh: Current DVFS status=$dvfs_status"

        # 尝试关闭DVFS
        if echo 0 >"$DVFS" 2>/dev/null; then
            # 确认DVFS已关闭
            new_status=$(cat "$DVFS" 2>/dev/null | cut -f2 -d ' ')
            if [[ "$new_status" == "0" ]]; then
                echo "post-fs-data.sh: DVFS successfully disabled"
            else
                echo "post-fs-data.sh: Warning: Failed to disable DVFS, current status is still $new_status"
            fi
        else
            echo "post-fs-data.sh: Warning: Unable to write to DVFS control file"
        fi
    else
        echo "post-fs-data.sh: DVFS file does not exist: $DVFS (this is normal for some devices)"
    fi
}
do_others
