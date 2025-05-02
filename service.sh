#!/system/bin/sh

MODDIR=${0%/*}

crash_recuser() {
    rm $MODDIR/logcat.log
    logcat -f $MODDIR/logcat.log &
    sleep 60
    killall logcat
    rm -f $MODDIR/need_recuser
}

(crash_recuser &)

sh "$MODDIR"/script/initsvc.sh