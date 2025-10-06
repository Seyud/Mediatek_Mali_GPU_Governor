#!/system/bin/sh
# 检测系统语言
# 返回: "zh" 或 "en"
detect_language() {
    # 默认设置为中文
    local language="zh"
    
    # 尝试获取系统语言
    local locale=$(getprop persist.sys.locale || getprop ro.product.locale || getprop persist.sys.language)
    
    # 如果系统语言是英文，设置语言为英文
    if echo "$locale" | grep -qi "en"; then
        language="en"
    fi
    
    echo "$language"
}

# 翻译函数 - 根据当前语言显示对应文本
# $1:中文文本 $2:英文文本
# 使用方式: translate "中文" "English"
translate() {
    [ "$language" = "en" ] && echo "$2" || echo "$1"
}

# 初始化语言设置
init_language() {
    language=$(detect_language)
    export language
}

# $1:value $2:filepaths
lock_val() {
    for p in $2; do
        if [ -f "$p" ]; then
            chmod 0666 "$p" 2> /dev/null
            #log "changing $p"
            echo "$1" > "$p"
            chmod 0444 "$p" 2> /dev/null
        fi
    done
}
# $1:filepaths $2:value
hide_val() {
    umount "$1" 2> /dev/null
    if [[ ! -f "/cache/$1" ]]; then
        mkdir -p "/cache/$1"
        rm -r "/cache/$1"
        cat "$1" > "/cache/$1"
    fi
    if [[ "$2" != "" ]]; then
        lock_val "$2" "$1"
    fi
    mount "/cache/$1" "$1"
}
# $1:value $2:filepaths
mask_val() {
    touch /data/local/tmp/mount_mask
    for p in $2; do
        if [ -f "$p" ]; then
            umount "$p"
            chmod 0666 "$p"
            echo "$1" > "$p"
            mount --bind /data/local/tmp/mount_mask "$p"
        fi
    done
}
# $1:value $2:filepaths
mutate() {
    for p in $2; do
        if [ -f "$p" ]; then
            chmod 0666 "$p" 2> /dev/null
            #log "writing $p"
            echo "$1" > "$p"
        fi
    done
}

# $1:file path
lock() {
    if [ -f "$1" ]; then
        chmod 0444 "$1" 2> /dev/null
        #log "locking $p"
    fi
}

# $1:value $2:list
has_val_in_list() {
    for item in $2; do
        if [ "$1" == "$item" ]; then
            echo "true"
            return
        fi
    done
    echo "false"
}

###############################
# Config File Operator
###############################

# $1:key $return:value(string)
read_cfg_value() {
    local value=""
    if [ -f "$PANEL_FILE" ]; then
        value="$(grep -i "^$1=" "$PANEL_FILE" | head -n 1 | tr -d ' ' | cut -d= -f2)"
    fi
    echo "$value"
}

###############################
# Log Functions
###############################

# 安全地将命令输出重定向到日志文件
# $1:log_file - 日志文件路径
# $2:command - 要执行的命令
log_command() {
    local log_file="$1"
    local command="$2"

    # 执行命令并将输出重定向到日志
    eval "$command" >> "$log_file" 2>&1
}

# 本地化日志输出
# $1:level
# $2:英文内容
# $3:中文内容（可选，缺失时使用英文内容）
log_localized() {
    local _level="$1"
    local en_text="$2"
    local zh_text="${3:-$2}"
    local timestamp
    local message

    timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    if [ "$language" = "en" ]; then
        message="$en_text"
    else
        message="$zh_text"
    fi

    printf '%s [%s] %s\n' "$timestamp" "$_level" "$message" >> "$INIT_LOG"
    sync
}

log_info() {
    log_localized "INFO" "$1" "$2"
}

log_warn() {
    log_localized "WARN" "$1" "$2"
}

log_error() {
    log_localized "ERROR" "$1" "$2"
}

log_debug() {
    log_localized "DEBUG" "$1" "$2"
}

clear_log() {
    true > "$INIT_LOG"
    sync
}

# $1:content
wait_until_login() {
    # in case of /data encryption is disabled
    while [ "$(getprop sys.boot_completed)" != "1" ]; do
        sleep 1
    done

    # we doesn't have the permission to rw "/sdcard" before the user unlocks the screen
    test_file="/sdcard/Android/.PERMISSION_TEST"
    true > "$test_file"
    while [ ! -f "$test_file" ]; do
        true > "$test_file"
        sleep 1
    done
    rm "$test_file"
}

#Prop File Reader
#grep_prop comes from https://github.com/topjohnwu/Magisk/blob/master/scripts/util_functions.sh#L43
grep_prop() {
    REGEX="s/^$1=//p"
    shift
    FILES="$@"
    [ -z "$FILES" ] && FILES='/system/build.prop'
    cat $FILES 2> /dev/null | dos2unix | sed -n "$REGEX" | head -n 1
}

target="$(getprop ro.board.platform)"
