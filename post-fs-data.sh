#!/system/bin/sh

MODDIR=${0%/*}

do_others() {
    if [ -f $MODDIR/USE_DEBUGFS ];then
        mount -t debugfs none /sys/kernel/debug
    fi

    DVFS=/proc/mali/dvfs_enable
    if [ -f $DVFS ];then
        echo 0 > $DVFS
    fi
}
do_others
