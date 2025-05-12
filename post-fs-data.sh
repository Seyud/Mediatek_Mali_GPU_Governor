#!/system/bin/sh

MODDIR=${0%/*}

do_others() {
    # 创建日志目录
    mkdir -p /data/adb/gpu_governor/log 2>/dev/null
    LOG_FILE="/data/adb/gpu_governor/log/initsvc.log"

    # 记录操作到日志
    echo "$(date) - post-fs-data.sh: 开始执行" >> "$LOG_FILE"

    if [ -f $MODDIR/USE_DEBUGFS ];then
        mount -t debugfs none /sys/kernel/debug
        echo "$(date) - post-fs-data.sh: 已挂载debugfs" >> "$LOG_FILE"
    fi

    DVFS=/proc/mali/dvfs_enable
    if [ -f $DVFS ];then
        # 读取当前DVFS状态
        dvfs_status=$(cat $DVFS | cut -f2 -d ' ')
        echo "$(date) - post-fs-data.sh: 当前DVFS状态=$dvfs_status" >> "$LOG_FILE"

        # 关闭DVFS
        echo 0 > $DVFS

        # 确认DVFS已关闭
        new_status=$(cat $DVFS | cut -f2 -d ' ')
        if [[ "$new_status" == "0" ]]; then
            echo "$(date) - post-fs-data.sh: DVFS已成功关闭" >> "$LOG_FILE"
        else
            echo "$(date) - post-fs-data.sh: 错误：无法关闭DVFS，当前状态仍为$new_status" >> "$LOG_FILE"
        fi
    else
        echo "$(date) - post-fs-data.sh: DVFS文件不存在: $DVFS" >> "$LOG_FILE"
    fi
}
do_others
