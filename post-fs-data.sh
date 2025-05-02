#!/system/bin/sh

MODDIR=${0%/*}

do_others() {
    rmdir /dev/cpuset/background/untrustedapp
    if [ -f $MODDIR/USE_DEBUGFS ];then
        mount -t debugfs none /sys/kernel/debug
    fi
}
do_others
