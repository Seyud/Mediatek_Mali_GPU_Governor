#!/system/bin/sh
# 天玑GPU调速器控制脚本
# 功能：
# 1. 控制调速器服务（启动/停止）
# 2. 设置日志等级
# 3. 使用音量键进行选择
#
# 注意：此脚本会被直接执行而不带参数

# 获取脚本所在目录
SCRIPT_DIR=${0%/*}
if [ "$SCRIPT_DIR" = "$0" ]; then
    SCRIPT_DIR=$(dirname "$0")
fi
if [ "$SCRIPT_DIR" = "." ]; then
    SCRIPT_DIR=$(pwd)
fi

# 定义常量
GPU_GOVERNOR_DIR="/data/adb/gpu_governor"
GPU_GOVERNOR_LOG_DIR="$GPU_GOVERNOR_DIR/log"
GPU_GOVERNOR_GAME_DIR="$GPU_GOVERNOR_DIR/game"
GAME_MODE_FILE="$GPU_GOVERNOR_GAME_DIR/game_mode"
LOG_LEVEL_FILE="$GPU_GOVERNOR_LOG_DIR/log_level"
GPU_GOV_LOG_FILE="$GPU_GOVERNOR_LOG_DIR/gpu_gov.log"
BIN_PATH="$SCRIPT_DIR/bin"
GPUGOVERNOR_BIN="$BIN_PATH/gpugovernor"

# 语言检测函数
detect_language() {
    # 尝试获取系统语言设置
    local system_locale=$(getprop persist.sys.locale 2> /dev/null || getprop ro.product.locale 2> /dev/null)

    # 如果无法获取或为空，尝试其他方法
    if [ -z "$system_locale" ]; then
        system_locale=$(settings get system system_locales 2> /dev/null || echo "zh-CN")
    fi

    # 检查是否包含中文标识
    if echo "$system_locale" | grep -q -i "zh"; then
        echo "zh"
    else
        echo "en"
    fi
}

# 设置当前语言
CURRENT_LANGUAGE=$(detect_language)

# 翻译函数
translate() {
    local zh_text="$1"
    local en_text="$2"

    if [ "$CURRENT_LANGUAGE" = "zh" ]; then
        echo "$zh_text"
    else
        echo "$en_text"
    fi
}

# 日志前缀函数
log_prefix() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")]"
}


# 确保目录存在并设置适当权限
mkdir -p "$GPU_GOVERNOR_DIR"
mkdir -p "$GPU_GOVERNOR_LOG_DIR"
mkdir -p "$GPU_GOVERNOR_GAME_DIR"
# 设置目录权限为777，确保任何进程都可以写入
chmod 0777 "$GPU_GOVERNOR_DIR"
chmod 0777 "$GPU_GOVERNOR_LOG_DIR"
chmod 0777 "$GPU_GOVERNOR_GAME_DIR"


# 确保文件存在
if [ ! -f "$GAME_MODE_FILE" ]; then
    echo "0" > "$GAME_MODE_FILE"
    chmod 666 "$GAME_MODE_FILE"
fi

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 666 "$LOG_LEVEL_FILE"
fi

# 音量键选择器函数
volume_key_selector() {
    local timeout=15
    local start_time=$(date +%s)
    local key_detected=""

    echo "$(log_prefix) $(translate "请使用音量键选择：" "Please use volume keys to select:")"
    echo "$(log_prefix) $(translate "[音量+] 确认选择  [音量-] 取消/返回" "[Volume+] Confirm  [Volume-] Cancel/Back")"
    echo "$(log_prefix) $(translate "等待用户选择（${timeout}秒后自动取消）..." "Waiting for user selection (auto-cancel in ${timeout} seconds)...")"

    while [ -z "$key_detected" ]; do
        local current_time=$(date +%s)
        if [ $((current_time - start_time)) -ge $timeout ]; then
            echo "$(log_prefix) $(translate "选择超时，自动取消" "Selection timeout, automatically cancelled")"
            return 1
        fi

        local key_event=$(getevent -qlc 1 2> /dev/null |
            awk 'BEGIN{FS=" "} /KEY_VOLUMEUP/{print "UP"; exit} /KEY_VOLUMEDOWN/{print "DOWN"; exit}')

        case "$key_event" in
            "UP")
                echo "$(log_prefix) $(translate "检测到音量上键" "Volume up key detected")"
                key_detected="confirm"
                ;;
            "DOWN")
                echo "$(log_prefix) $(translate "检测到音量下键" "Volume down key detected")"
                key_detected="cancel"
                ;;
        esac
        sleep 0.2
    done

    [ "$key_detected" = "confirm" ] && return 0 || return 1
}

# 检查GPU调速器服务状态
check_governor_status() {
    if pgrep -f "gpugovernor" > /dev/null; then
        translate "运行中" "Running"
        return 0
    else
        translate "未运行" "Not running"
        return 1
    fi
}

# 启动GPU调速器服务
start_governor() {
    # 检查服务是否已经运行
    if check_governor_status > /dev/null; then
        echo "$(log_prefix) $(translate "GPU调速器服务已经在运行中" "GPU Governor service is already running")"
        return 0
    fi

    # 如果BIN_PATH不存在，尝试查找其他可能的位置
    if [ ! -d "$BIN_PATH" ]; then
        echo "$(log_prefix) $(translate "BIN_PATH不存在，尝试查找其他位置" "BIN_PATH does not exist, trying to find alternative locations")"

        # 尝试在模块目录下查找
        if [ -d "/data/adb/modules/Mediatek_Mali_GPU_Governor/bin" ]; then
            BIN_PATH="/data/adb/modules/Mediatek_Mali_GPU_Governor/bin"
            GPUGOVERNOR_BIN="$BIN_PATH/gpugovernor"
            echo "$(log_prefix) $(translate "找到备选路径" "Found alternative path"): $BIN_PATH"
        fi
    fi

    # 确保二进制文件存在并有执行权限
    if [ ! -f "$GPUGOVERNOR_BIN" ]; then
        echo "$(log_prefix) $(translate "错误: 二进制文件不存在" "Error: Binary file does not exist"): $GPUGOVERNOR_BIN"

        # 尝试在系统中查找gpugovernor二进制文件
        FOUND_BIN=$(find /data/adb/modules -name gpugovernor -type f 2> /dev/null | head -n 1)
        if [ -n "$FOUND_BIN" ]; then
            echo "$(log_prefix) $(translate "找到二进制文件" "Found binary file"): $FOUND_BIN"
            GPUGOVERNOR_BIN="$FOUND_BIN"
        else
            echo "$(log_prefix) $(translate "无法找到gpugovernor二进制文件" "Unable to find gpugovernor binary file")"
            return 1
        fi
    fi

    if [ ! -x "$GPUGOVERNOR_BIN" ]; then
        echo "$(log_prefix) $(translate "二进制文件没有执行权限，尝试修复" "Binary file does not have execution permission, attempting to fix")"
        chmod 0755 "$GPUGOVERNOR_BIN"
    fi

    # 读取日志等级
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
    fi

    echo "$(log_prefix) $(translate "正在以$log_level级别启动GPU调速器服务..." "Starting GPU Governor service with $log_level level...")"

    # 启动服务
    echo "$(log_prefix) $(translate "执行命令" "Executing command"): nohup $GPUGOVERNOR_BIN >> $GPU_GOV_LOG_FILE 2>&1 &"
    nohup "$GPUGOVERNOR_BIN" >> "$GPU_GOV_LOG_FILE" 2>&1 &

    # 等待服务启动
    sleep 2
    if check_governor_status > /dev/null; then
        echo "$(log_prefix) $(translate "GPU调速器服务启动成功" "GPU Governor service started successfully")"
        return 0
    else
        echo "$(log_prefix) $(translate "GPU调速器服务启动失败，请检查日志" "GPU Governor service failed to start, please check logs")"
        echo "$(log_prefix) $(translate "启动失败，请检查日志获取详细错误信息" "Start failed, please check log for detailed error information"): $GPU_GOV_LOG_FILE"
        return 1
    fi
}

# 停止GPU调速器服务
stop_governor() {
    if ! check_governor_status > /dev/null; then
        echo "$(log_prefix) $(translate "GPU调速器服务未运行" "GPU Governor service is not running")"
        return 0
    fi

    echo "$(log_prefix) $(translate "正在停止GPU调速器服务..." "Stopping GPU Governor service...")"
    killall gpugovernor 2> /dev/null

    # 等待服务停止
    sleep 1
    if ! check_governor_status > /dev/null; then
        echo "$(log_prefix) $(translate "GPU调速器服务已停止" "GPU Governor service has been stopped")"
        return 0
    else
        echo "$(log_prefix) $(translate "无法停止GPU调速器服务，尝试强制终止" "Unable to stop GPU Governor service, attempting to force terminate")"
        killall -9 gpugovernor 2> /dev/null
        sleep 1
        if ! check_governor_status > /dev/null; then
            echo "$(log_prefix) $(translate "GPU调速器服务已强制停止" "GPU Governor service has been forcibly stopped")"
            return 0
        else
            echo "$(log_prefix) $(translate "无法终止GPU调速器服务，请手动检查" "Unable to terminate GPU Governor service, please check manually")"
            return 1
        fi
    fi
}

# 显示当前状态
show_status() {
    echo "----------------------------------------"
    echo "$(log_prefix) $(translate "天玑GPU调速器状态信息" "Mediatek GPU Governor Status Information")"
    echo "----------------------------------------"

    # 显示游戏模式状态
    local game_mode=$(cat "$GAME_MODE_FILE")
    if [ "$game_mode" = "1" ]; then
        echo "$(log_prefix) $(translate "游戏模式: 已开启" "Game Mode: Enabled")"
    else
        echo "$(log_prefix) $(translate "游戏模式: 已关闭" "Game Mode: Disabled")"
    fi

    # 显示调速器服务状态
    local governor_status=$(check_governor_status)
    echo "$(log_prefix) $(translate "调速器服务: $governor_status" "Governor Service: $governor_status")"

    # 显示日志等级
    local log_level=$(cat "$LOG_LEVEL_FILE")
    echo "$(log_prefix) $(translate "日志等级: $log_level" "Log Level: $log_level")"

    # 显示设备信息
    local unknown_text=$(translate "未知" "Unknown")
    echo "$(log_prefix) $(translate "设备型号: " "Device Model: ")$(getprop ro.product.model 2> /dev/null || echo "$unknown_text")"
    echo "$(log_prefix) $(translate "安卓版本: " "Android Version: ")$(getprop ro.build.version.release 2> /dev/null || echo "$unknown_text")"

    # 显示模块版本
    local version=""
    # 尝试从不同位置读取模块版本
    if [ -f "$SCRIPT_DIR/module.prop" ]; then
        version=$(grep "^version=" "$SCRIPT_DIR/module.prop" | cut -d= -f2)
    elif [ -f "/data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop" ]; then
        version=$(grep "^version=" "/data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop" | cut -d= -f2)
    else
        # 尝试查找模块属性文件
        local module_prop=$(find /data/adb/modules -name module.prop -type f | grep -i gpu | head -n 1)
        if [ -n "$module_prop" ]; then
            version=$(grep "^version=" "$module_prop" | cut -d= -f2)
        else
            version=$(translate "未知" "Unknown")
        fi
    fi
    echo "$(log_prefix) $(translate "模块版本: " "Module Version: ")$version"
    echo "----------------------------------------"
}

# 处理日志等级设置
handle_log_level() {
    # 显示当前日志等级和可用选项
    local current_level=$(cat "$LOG_LEVEL_FILE")
    echo "$(log_prefix) $(translate "当前日志等级: $current_level" "Current log level: $current_level")"
    echo "$(log_prefix) $(translate "可用的日志等级选项: debug, info, warn, error" "Available log level options: debug, info, warn, error")"

    # 等待用户选择
    echo "$(translate "请选择日志等级" "Please select a log level"):"
    echo "1. debug ($(translate "调试" "Debug"))"
    echo "2. info ($(translate "信息" "Information"))"
    echo "3. warn ($(translate "警告" "Warning"))"
    echo "4. error ($(translate "错误" "Error"))"

    echo "$(translate "请使用音量键选择：" "Please use volume keys to select:")"
    echo "$(translate "[音量+] 下一选项  [音量-] 确认选择" "[Volume+] Next option  [Volume-] Confirm selection")"

    local log_selection=0 # 初始化为0，表示未选择
    local log_confirmed=0

    while [ $log_confirmed -eq 0 ]; do
        # 获取按键
        local key_event=$(getevent -qlc 1 2> /dev/null |
            awk 'BEGIN{FS=" "} /KEY_VOLUMEUP/{print "UP"; exit} /KEY_VOLUMEDOWN/{print "DOWN"; exit}')

        case "$key_event" in
            "UP")
                # 音量上键 - 下一选项
                log_selection=$((log_selection + 1))
                [ $log_selection -gt 4 ] && log_selection=1
                # 显示当前选择
                case $log_selection in
                    1) echo "$(translate "当前选择" "Current selection"): debug" ;;
                    2) echo "$(translate "当前选择" "Current selection"): info" ;;
                    3) echo "$(translate "当前选择" "Current selection"): warn" ;;
                    4) echo "$(translate "当前选择" "Current selection"): error" ;;
                esac
                ;;
            "DOWN")
                # 音量下键 - 确认选择
                if [ $log_selection -eq 0 ]; then
                    echo "$(translate "请先选择一个日志等级" "Please select a log level first")"
                    continue
                fi
                log_confirmed=1
                ;;
        esac

        # 短暂延迟，避免按键检测过快
        [ $log_confirmed -eq 0 ] && sleep 0.3
    done

    # 根据选择设置日志等级
    local selected_level=""
    case $log_selection in
        1) selected_level="debug" ;;
        2) selected_level="info" ;;
        3) selected_level="warn" ;;
        4) selected_level="error" ;;
    esac

    # 设置日志等级
    echo "$selected_level" > "$LOG_LEVEL_FILE"
    echo "$(log_prefix) $(translate "日志等级已设置为: $selected_level" "Log level has been set to: $selected_level")"
    return 0
}

# 显示主菜单并处理选择
show_menu() {
    # 显示欢迎信息
    echo "=========================================="
    echo "       $(translate "天玑GPU调速器 - 控制菜单" "Mediatek GPU Governor - Control Menu")           "
    echo "=========================================="
    echo "$(log_prefix) $(translate "欢迎使用天玑GPU调速器控制菜单" "Welcome to the Mediatek GPU Governor control menu")"
    echo "----------------------------------------"

    # 显示当前状态
    show_status

    local governor_status=$(check_governor_status)
    local governor_action=$(translate "启动" "Start")
    [ "$governor_status" = $(translate "运行中" "Running") ] && governor_action=$(translate "停止" "Stop")

    echo "=========================================="
    echo "$(translate "请选择操作：" "Please select an operation:")"
    echo "1. ${governor_action}$(translate "调速器服务" " Governor Service") ($(translate "当前" "Current"): $governor_status)"
    echo "2. $(translate "设置日志等级" "Set Log Level") ($(translate "当前" "Current"): $(cat "$LOG_LEVEL_FILE"))"
    echo "0. $(translate "退出" "Exit")"
    echo "=========================================="
    echo "$(translate "请使用音量键选择操作：" "Please use volume keys to select:")"
    echo "$(translate "[音量+] 下一选项  [音量-] 确认选择" "[Volume+] Next option  [Volume-] Confirm selection")"
    echo "----------------------------------------"

    local selection=1
    local confirmed=0
    local timeout=30
    local start_time=$(date +%s)

    while [ $confirmed -eq 0 ]; do
        # 显示当前选择
        case $selection in
            1) echo "$(translate "当前选择" "Current selection"): 1. ${governor_action}$(translate "调速器服务" " Governor Service")" ;;
            2) echo "$(translate "当前选择" "Current selection"): 2. $(translate "设置日志等级" "Set Log Level")" ;;
            0) echo "$(translate "当前选择" "Current selection"): 0. $(translate "退出" "Exit")" ;;
        esac

        # 检查超时
        local current_time=$(date +%s)
        if [ $((current_time - start_time)) -ge $timeout ]; then
            echo "$(log_prefix) $(translate "选择超时，自动退出" "Selection timeout, automatically exiting")"
            return
        fi

        # 获取按键
        local key_event=$(getevent -qlc 1 2> /dev/null |
            awk 'BEGIN{FS=" "} /KEY_VOLUMEUP/{print "UP"; exit} /KEY_VOLUMEDOWN/{print "DOWN"; exit}')

        case "$key_event" in
            "UP")
                # 音量上键 - 下一选项
                selection=$((selection + 1))
                [ $selection -gt 2 ] && selection=0
                ;;
            "DOWN")
                # 音量下键 - 确认选择
                confirmed=1
                ;;
        esac

        # 短暂延迟，避免按键检测过快
        [ $confirmed -eq 0 ] && sleep 0.3
    done

    echo "$(log_prefix) $(translate "已选择选项" "Selected option") $selection"

    # 处理选择
    case $selection in
        0)
            echo "$(log_prefix) $(translate "退出菜单" "Exiting menu")"
            return
            ;;
        1)
            if [ "$governor_status" = $(translate "运行中" "Running") ]; then
                echo "$(log_prefix) $(translate "停止调速器服务" "Stopping governor service")"
                stop_governor
            else
                echo "$(log_prefix) $(translate "启动调速器服务" "Starting governor service")"
                start_governor
            fi
            # 显示新状态并返回主菜单
            sleep 1
            show_menu
            ;;
        2)
            echo "$(log_prefix) $(translate "设置日志等级" "Setting log level")"
            echo "$(translate "可用的日志等级" "Available log levels"): debug, info, warn, error"
            echo "$(translate "当前日志等级" "Current log level"): $(cat "$LOG_LEVEL_FILE")"

            handle_log_level

            # 返回主菜单
            sleep 1
            show_menu
            ;;
    esac
}

# 直接显示交互式菜单，不处理命令行参数
# 因为脚本会被直接执行而不带参数
show_menu
