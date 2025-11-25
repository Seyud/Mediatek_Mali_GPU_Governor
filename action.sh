#!/system/bin/sh
# 天玑GPU调速器控制脚本
# 功能：
# 1. 控制调速器服务（启动/停止）
# 2. 设置日志等级
# 3. 使用音量键进行选择
MODDIR=${0%/*}

. $MODDIR/script/libcommon.sh

GPU_GOVERNOR_DIR="/data/adb/gpu_governor"
GPU_GOVERNOR_LOG_DIR="$GPU_GOVERNOR_DIR/log"
LOG_LEVEL_FILE="$GPU_GOVERNOR_LOG_DIR/log_level"
GPU_GOV_LOG_FILE="$GPU_GOVERNOR_LOG_DIR/gpu_gov.log"
BIN_PATH="$MODDIR/bin"
GPUGOVERNOR_BIN="$BIN_PATH/gpugovernor"

init_language

log_prefix() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")]"
}

mkdir -p "$GPU_GOVERNOR_DIR"
mkdir -p "$GPU_GOVERNOR_LOG_DIR"
chmod 0777 "$GPU_GOVERNOR_DIR"
chmod 0777 "$GPU_GOVERNOR_LOG_DIR"

# 运行时初始化默认日志等级（info），已存在则保持不变
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

    # 确保BIN_PATH存在
    if [ ! -d "$BIN_PATH" ]; then
        echo "$(log_prefix) $(translate "错误: BIN_PATH不存在" "Error: BIN_PATH does not exist"): $BIN_PATH"
        return 1
    fi

    # 确保二进制文件存在并有执行权限
    if [ ! -f "$GPUGOVERNOR_BIN" ]; then
        echo "$(log_prefix) $(translate "错误: 二进制文件不存在" "Error: Binary file does not exist"): $GPUGOVERNOR_BIN"
        return 1
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

    # 启动服务，让Rust程序自己处理日志文件写入
    echo "$(log_prefix) $(translate "执行命令" "Executing command"): nohup $GPUGOVERNOR_BIN > /dev/null 2>&1 &"
    nohup "$GPUGOVERNOR_BIN" > /dev/null 2>&1 &

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
    # 从模块目录读取版本信息
    if [ -f "$MODDIR/module.prop" ]; then
        version=$(grep "^version=" "$MODDIR/module.prop" | cut -d= -f2)
    else
        version=$(translate "未知" "Unknown")
    fi
    echo "$(log_prefix) $(translate "模块版本: " "Module Version: ")$version"
    echo "----------------------------------------"
}

# 处理日志等级设置
handle_log_level() {
    local log_selection=1  # 默认选择 info (选项2)
    local log_confirmed=0

    while true; do
        # 显示当前日志等级和可用选项
        local current_level=$(cat "$LOG_LEVEL_FILE")
        
        clear
        echo "=========================================="
        echo "       $(translate "设置日志等级" "Set Log Level")           "
        echo "=========================================="
        echo "$(log_prefix) $(translate "当前日志等级: $current_level" "Current log level: $current_level")"
        echo ""
        echo "$(translate "请选择日志等级" "Please select a log level"):"
        
        # 显示带箭头的选项
        if [ $log_selection -eq 1 ]; then
            echo "  ▶ 1. debug ($(translate "调试" "Debug"))"
        else
            echo "    1. debug ($(translate "调试" "Debug"))"
        fi
        
        if [ $log_selection -eq 2 ]; then
            echo "  ▶ 2. info ($(translate "信息" "Information"))"
        else
            echo "    2. info ($(translate "信息" "Information"))"
        fi
        
        if [ $log_selection -eq 3 ]; then
            echo "  ▶ 3. warn ($(translate "警告" "Warning"))"
        else
            echo "    3. warn ($(translate "警告" "Warning"))"
        fi
        
        if [ $log_selection -eq 4 ]; then
            echo "  ▶ 4. error ($(translate "错误" "Error"))"
        else
            echo "    4. error ($(translate "错误" "Error"))"
        fi

        echo ""
        echo "$(translate "请使用音量键选择：" "Please use volume keys to select:")"
        echo "$(translate "[音量+] 确认选择  [音量-] 下一选项" "[Volume+] Confirm selection  [Volume-] Next option")"
        echo "=========================================="

        log_confirmed=0

        while [ $log_confirmed -eq 0 ]; do
            # 短暂延迟，避免按键检测过快
            sleep 0.2
            
            # 获取按键（只响应按下事件，忽略松开事件）
            case "$(getevent -qlc 1 2>/dev/null)" in
                *KEY_VOLUMEUP*DOWN*)
                    # 音量上键 - 确认选择
                    log_confirmed=1
                    ;;
                *KEY_VOLUMEDOWN*DOWN*)
                    # 音量下键 - 下一选项
                    log_selection=$((log_selection + 1))
                    [ $log_selection -gt 4 ] && log_selection=1
                    # 重新绘制菜单
                    break
                    ;;
            esac
        done
        
        # 如果确认选择，则处理
        if [ $log_confirmed -eq 1 ]; then
            break
        fi
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

# 主菜单逻辑 - 使用固定菜单界面
main_menu() {
    local selection=1
    local confirmed=0
    
    while true; do
        # 获取当前状态
        local governor_status=$(check_governor_status)
        local governor_action=$(translate "启动" "Start")
        [ "$governor_status" = $(translate "运行中" "Running") ] && governor_action=$(translate "停止" "Stop")
        local current_log_level=$(cat "$LOG_LEVEL_FILE")

        # 构建菜单选项文本
        local option1="${governor_action}$(translate "调速器服务" " Governor Service") ($(translate "当前" "Current"): $governor_status)"
        local option2="$(translate "设置日志等级" "Set Log Level") ($(translate "当前" "Current"): $current_log_level)"
        local option0="$(translate "退出" "Exit")"

        # 清屏并显示菜单
        clear
        echo "=========================================="
        echo "       $(translate "天玑GPU调速器 - 控制菜单" "Mediatek GPU Governor - Control Menu")           "
        echo "=========================================="

        # 显示当前状态
        show_status

        echo "=========================================="
        echo "$(translate "请选择操作：" "Please select an operation:")"
        
        # 显示带箭头的选项
        if [ $selection -eq 1 ]; then
            echo "  ▶ 1. $option1"
        else
            echo "    1. $option1"
        fi
        
        if [ $selection -eq 2 ]; then
            echo "  ▶ 2. $option2"
        else
            echo "    2. $option2"
        fi
        
        if [ $selection -eq 0 ]; then
            echo "  ▶ 0. $option0"
        else
            echo "    0. $option0"
        fi
        
        echo "=========================================="
        echo "$(translate "请使用音量键选择操作：" "Please use volume keys to select:")"
        echo "$(translate "[音量+] 确认选择  [音量-] 下一选项" "[Volume+] Confirm selection  [Volume-] Next option")"
        echo "----------------------------------------"

        # 重置超时计时器
        local timeout=30
        local start_time=$(date +%s)
        confirmed=0

        while [ $confirmed -eq 0 ]; do
            # 检查超时
            local current_time=$(date +%s)
            if [ $((current_time - start_time)) -ge $timeout ]; then
                clear
                echo "$(log_prefix) $(translate "选择超时，自动退出" "Selection timeout, automatically exiting")"
                return
            fi

            # 短暂延迟，避免按键检测过快
            sleep 0.2
            
            # 获取按键（只响应按下事件，忽略松开事件）
            case "$(getevent -qlc 1 2>/dev/null)" in
                *KEY_VOLUMEUP*DOWN*)
                    # 音量上键 - 确认选择
                    confirmed=1
                    ;;
                *KEY_VOLUMEDOWN*DOWN*)
                    # 音量下键 - 下一选项
                    selection=$((selection + 1))
                    [ $selection -gt 2 ] && selection=0
                    # 重新绘制菜单
                    break
                    ;;
            esac
        done
        
        # 如果确认选择，则处理
        if [ $confirmed -eq 1 ]; then
            break
        fi
    done

    echo "$(log_prefix) $(translate "已选择选项" "Selected option") $selection"

    # 处理选择
    case $selection in
        0)
            clear
            echo "$(log_prefix) $(translate "退出菜单" "Exiting menu")"
            return
            ;;
        1)
            # 需要重新获取状态，因为可能已经改变
            governor_status=$(check_governor_status)
            if [ "$governor_status" = $(translate "运行中" "Running") ]; then
                echo "$(log_prefix) $(translate "停止调速器服务" "Stopping governor service")"
                stop_governor
            else
                echo "$(log_prefix) $(translate "启动调速器服务" "Starting governor service")"
                start_governor
            fi
            # 等待用户查看结果
            sleep 2
            # 重新显示菜单
            main_menu
            ;;
        2)
            echo "$(log_prefix) $(translate "设置日志等级" "Setting log level")"

            handle_log_level

            # 等待用户查看结果
            sleep 2
            # 重新显示菜单
            main_menu
            ;;
    esac
}

# 显示交互式菜单
main_menu
