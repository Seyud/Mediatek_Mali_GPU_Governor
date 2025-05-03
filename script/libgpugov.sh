#!/system/bin/sh
# 使用更可靠的方式获取脚本目录
if [ -z "$SCRIPT_PATH" ]; then
    # 如果SCRIPT_PATH未定义，尝试确定脚本目录
    BASEDIR="$(dirname "$0")"
    if [ "$BASEDIR" = "." ]; then
        BASEDIR="$(pwd)"
    fi

    # 确定脚本所在目录
    if [ "$(basename "$BASEDIR")" = "script" ]; then
        # 如果当前脚本在script目录下，则模块目录是其父目录
        SCRIPT_PATH="$BASEDIR"
        MODULE_PATH="$(dirname "$BASEDIR")"
    else
        # 否则假设模块目录就是当前目录，script是其子目录
        MODULE_PATH="$BASEDIR"
        SCRIPT_PATH="$MODULE_PATH/script"
    fi

    # 记录到初始化日志
    if [ -f "/data/adb/gpu_governor/log/initsvc.log" ]; then
        echo "已确定 SCRIPT_PATH=$SCRIPT_PATH" >> "/data/adb/gpu_governor/log/initsvc.log"
        echo "已确定 MODULE_PATH=$MODULE_PATH" >> "/data/adb/gpu_governor/log/initsvc.log"
    fi
else
    if [ -f "/data/adb/gpu_governor/log/initsvc.log" ]; then
        echo "使用提供的 SCRIPT_PATH=$SCRIPT_PATH" >> "/data/adb/gpu_governor/log/initsvc.log"
    fi
fi

# 加载必要的库文件
if [ -f "$SCRIPT_PATH/pathinfo.sh" ]; then
    . "$SCRIPT_PATH/pathinfo.sh"
else
    if [ -f "/data/adb/gpu_governor/log/initsvc.log" ]; then
        echo "错误: pathinfo.sh 未在 $SCRIPT_PATH 中找到" >> "/data/adb/gpu_governor/log/initsvc.log"
    fi
    exit 1
fi

if [ -f "$SCRIPT_PATH/libcommon.sh" ]; then
    . "$SCRIPT_PATH/libcommon.sh"
else
    log "错误: libcommon.sh 未在 $SCRIPT_PATH 中找到"
    exit 1
fi

if [ -f "$SCRIPT_PATH/libcgroup.sh" ]; then
    . "$SCRIPT_PATH/libcgroup.sh"
else
    log "错误: libcgroup.sh 未在 $SCRIPT_PATH 中找到"
    exit 1
fi

if [ -f "$SCRIPT_PATH/libsysinfo.sh" ]; then
    . "$SCRIPT_PATH/libsysinfo.sh"
else
    log "错误: libsysinfo.sh 未在 $SCRIPT_PATH 中找到"
    exit 1
fi

GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
LOG_LEVEL_FILE="$GAMES_PATH/log_level"
MAX_LOG_SIZE_MB=5 # 日志文件最大大小，单位MB

# 使用libcommon.sh中的统一日志轮转函数
# 此函数保留用于向后兼容，实际调用统一的rotate_log函数

gpugov_start() {
    # 检查二进制文件是否存在
    if [ ! -f "$BIN_PATH/gpugovernor" ]; then
        log "错误: 二进制文件未找到，路径: $BIN_PATH/gpugovernor"
        return 1
    fi

    # 设置执行权限
    if [ ! -x "$BIN_PATH/gpugovernor" ]; then
        log "错误: 二进制文件没有执行权限，尝试修复"
        chmod 0755 "$BIN_PATH/gpugovernor"
        if [ ! -x "$BIN_PATH/gpugovernor" ]; then
            log "错误: 设置执行权限失败"
            return 1
        fi
        log "已成功设置执行权限"
    fi

    # 确保日志目录存在
    mkdir -p "$LOG_PATH" 2>/dev/null
    chmod 0777 "$LOG_PATH" 2>/dev/null

    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    log "正在启动GPU调速器"
    sync

    # 读取日志等级设置
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
        log "日志等级设置为: $log_level"
    else
        log "未找到日志等级文件，使用默认值: info"
        # 创建日志等级文件
        echo "info" > "$LOG_LEVEL_FILE"
        chmod 0666 "$LOG_LEVEL_FILE"
    fi

    # 检查配置文件是否存在
    if [ ! -f "$GPUGOV_CONFPATH" ]; then
        log "错误: 配置文件未找到，路径: $GPUGOV_CONFPATH"
        return 1
    fi

    # 根据日志等级决定是否启用调试输出
    if [ "$log_level" = "debug" ]; then
        log "已启用调试级别，将显示控制台输出"
        # 启动进程并设置环境变量，使用绝对路径启用调试输出，输出重定向到主日志文件
        nohup env GPU_GOV_DEBUG=1 GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >> "$GPUGOV_LOGPATH" 2>&1 &
    else
        log "使用日志等级: $log_level"
        # 启动进程，使用绝对路径不启用调试输出，输出重定向到主日志文件
        nohup env GPU_GOV_LOG_LEVEL="$log_level" "$BIN_PATH/gpugovernor" >> "$GPUGOV_LOGPATH" 2>&1 &
    fi
    sync

    # 等待进程启动
    sleep 3
    if ! pgrep -f "gpugovernor" >/dev/null; then
        log "错误: 进程启动失败"
        # 检查日志文件中的错误信息
        if [ -f "$GPUGOV_LOGPATH" ]; then
            log "最后10行日志:"
            tail -n 10 "$GPUGOV_LOGPATH" >> "$LOG_FILE"
            log "请查看日志文件获取详细信息: $GPUGOV_LOGPATH"
        fi
        return 1
    fi

    # 设置进程优先级
    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    log "GPU调速器启动成功"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
}
gpugov_testconf() {
    # 确保日志目录存在
    mkdir -p "$LOG_PATH" 2>/dev/null
    chmod 0777 "$LOG_PATH" 2>/dev/null

    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    log "开始GPU调速器配置检查"

    # 检查用户配置文件
    if [ -f "$USER_PATH/gpu_freq_table.conf" ]; then
        log "在 $USER_PATH/gpu_freq_table.conf 找到用户配置"
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    else
        log "未找到用户配置，正在创建"

        # 获取设备平台信息
        target="$(getprop ro.board.platform)"
        log "设备平台: $target"

        cfgname="$(get_config_name $target)"
        log "从平台获取的配置名称: $cfgname"

        if [ "$cfgname" = "unsupported" ]; then
            target="$(getprop ro.product.board)"
            log "使用产品板: $target"

            cfgname="$(get_config_name "$target")"
            log "从产品板获取的配置名称: $cfgname"
        fi

        # 如果平台支持，使用平台特定配置，否则使用默认配置
        if [ "$cfgname" != "unsupported" ] && [ -f "$MODULE_PATH/config/$cfgname.conf" ]; then
            log "使用平台特定配置: $cfgname.conf"

            # 确保目标目录存在
            mkdir -p "$USER_PATH" 2>/dev/null

            cp -f "$MODULE_PATH/config/$cfgname.conf" "$USER_PATH/gpu_freq_table.conf"
            chmod 0666 "$USER_PATH/gpu_freq_table.conf"
            log "已从 $cfgname.conf 创建平台特定配置"
        else
            if [ "$cfgname" = "unsupported" ]; then
                log "警告: 不支持的平台，使用默认配置"
            else
                log "未找到平台特定配置，使用默认配置"
            fi

            # 确保目标目录存在
            mkdir -p "$USER_PATH" 2>/dev/null

            cp -f "$MODULE_PATH/gpu_freq_table.conf" "$USER_PATH/gpu_freq_table.conf"
            chmod 0666 "$USER_PATH/gpu_freq_table.conf"
            log "已从默认的 gpu_freq_table.conf 创建配置"
        fi
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    fi

    log "使用配置: $GPUGOV_CONFPATH"

    # 检查配置文件是否存在且可读
    if [ ! -f "$GPUGOV_CONFPATH" ]; then
        log "错误: 尝试创建后仍未找到配置文件，路径: $GPUGOV_CONFPATH"
        return 1
    fi

    if [ ! -r "$GPUGOV_CONFPATH" ]; then
        log "错误: 配置文件不可读，路径: $GPUGOV_CONFPATH"
        chmod 0666 "$GPUGOV_CONFPATH"
    fi

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    # 启动GPU调速器
    log "正在启动GPU调速器"
    gpugov_start
}



