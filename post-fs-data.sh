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

    # 关闭DCS Policy (仅针对天玑9000)
    DCS_MODE=/sys/kernel/ged/hal/dcs_mode

    # 检测设备平台，判断是否为天玑9000 (mt6983)
    platform="$(getprop ro.board.platform)"
    if [ "$platform" = "mt6983" ]; then
        # 进一步验证是否为真正的天玑9000，而非其他错误识别的mt6983设备
        cpu7_freq="$(cat /sys/devices/system/cpu/cpu7/cpufreq/cpuinfo_max_freq 2>/dev/null || echo 0)"
        if [ "$cpu7_freq" -ge 2700000 ]; then
            echo "post-fs-data.sh: Detected Dimensity 9000 device (mt6983 with CPU7 >= 2.7GHz)"

            if [ -f "$DCS_MODE" ]; then
                # 读取当前DCS Policy状态
                dcs_status=$(cat "$DCS_MODE" 2>/dev/null)
                echo "post-fs-data.sh: Current DCS Policy status=$dcs_status"

                # 检查是否已经禁用
                if echo "$dcs_status" | grep -q "disabled"; then
                    echo "post-fs-data.sh: DCS Policy is already disabled"
                else
                    # 尝试关闭DCS Policy
                    if echo 0 >"$DCS_MODE" 2>/dev/null; then
                        # 确认DCS Policy已关闭
                        new_status=$(cat "$DCS_MODE" 2>/dev/null)
                        if echo "$new_status" | grep -q "disabled"; then
                            echo "post-fs-data.sh: DCS Policy successfully disabled on Dimensity 9000"
                        else
                            echo "post-fs-data.sh: Warning: Failed to disable DCS Policy, current status is still $new_status"
                        fi
                    else
                        echo "post-fs-data.sh: Warning: Unable to write to DCS Policy control file"
                    fi
                fi
            else
                echo "post-fs-data.sh: DCS Policy file does not exist: $DCS_MODE (this is normal for some devices)"
            fi
        else
            echo "post-fs-data.sh: Detected mt6983 but CPU7 frequency is low ($cpu7_freq), not Dimensity 9000, skipping DCS Policy disable"
        fi
    else
        echo "post-fs-data.sh: Platform is $platform (not mt6983/Dimensity 9000), skipping DCS Policy disable"
    fi
}
do_others
