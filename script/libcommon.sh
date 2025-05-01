#!/system/bin/sh
#
# Copyright (C) 2021-2022 Matt Yang
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

###############################
# Basic tool functions
###############################

# $1:value $2:filepaths

lock_val() {
    for p in $2; do
        if [ -f "$p" ]; then
            chmod 0666 "$p" 2>/dev/null
            #log "changing $p"
            echo "$1" >"$p"
            chmod 0444 "$p" 2>/dev/null
        fi
    done
}
# $1:filepaths $2:value
hide_val() {
    umount "$1" 2>/dev/null
    if [[ ! -f "/cache/$1" ]]; then
        mkdir -p "/cache/$1"
        rm -r "/cache/$1"
        cat "$1" >"/cache/$1"
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
            echo "$1" >"$p"
            mount --bind /data/local/tmp/mount_mask "$p"
        fi
    done
}
# $1:value $2:filepaths
mutate() {
    for p in $2; do
        if [ -f "$p" ]; then
            chmod 0666 "$p" 2>/dev/null
            #log "writing $p"
            echo "$1" >"$p"
        fi
    done
}

# $1:file path
lock() {
    if [ -f "$1" ]; then
        chmod 0444 "$1" 2>/dev/null
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

# 统一的日志轮转函数
# $1:log_file - 日志文件路径
# $2:max_size_mb - 最大日志大小(MB)，默认为5MB
rotate_log() {
    local log_file="$1"
    local max_size_mb="${2:-5}"
    local max_size_bytes=$((max_size_mb * 1024 * 1024))
    # 设置轮转阈值为最大大小的80%，提前进行轮转
    local threshold_bytes=$(( (max_size_bytes * 8) / 10 ))

    # 确保日志文件存在
    if [ ! -f "$log_file" ]; then
        touch "$log_file"
        chmod 0666 "$log_file"
        return 0
    fi

    # 获取文件大小（以字节为单位）
    local file_size=$(stat -c %s "$log_file" 2>/dev/null || stat -f %z "$log_file" 2>/dev/null)

    # 如果获取文件大小失败，假设需要轮转
    if [ -z "$file_size" ] || [ "$file_size" -eq 0 ]; then
        file_size=0
        return 0
    fi

    # 如果文件大小超过阈值（80%的限制），进行轮转
    if [ "$file_size" -gt "$threshold_bytes" ]; then
        echo "日志文件 $log_file 大小($file_size 字节)超过阈值($threshold_bytes 字节)，进行轮转"

        # 创建备份文件（如果已存在则覆盖）
        cp "$log_file" "${log_file}.bak" 2>/dev/null

        # 清空原日志文件
        true > "$log_file"
        chmod 0666 "$log_file"

        # 记录轮转信息
        echo "$(date) - 日志已轮转，原日志已备份到 ${log_file}.bak" >> "$log_file"
        sync
        return 1
    fi

    return 0
}

# 安全地将命令输出重定向到日志文件，并检查日志大小
# $1:log_file - 日志文件路径
# $2:command - 要执行的命令
log_command() {
    local log_file="$1"
    local command="$2"

    # 先检查并轮转日志
    rotate_log "$log_file"

    # 执行命令并将输出重定向到日志
    eval "$command" >> "$log_file" 2>&1

    # 执行后再次检查日志大小
    rotate_log "$log_file"
}

# $1:content
wait_until_login() {
    # in case of /data encryption is disabled
    while [ "$(getprop sys.boot_completed)" != "1" ]; do
        sleep 1
    done

    # we doesn't have the permission to rw "/sdcard" before the user unlocks the screen
    test_file="/sdcard/Android/.PERMISSION_TEST"
    true >"$test_file"
    while [ ! -f "$test_file" ]; do
        true >"$test_file"
        sleep 1
    done
    rm "$test_file"
}

#Prop File Reader
#grep_prop comes from https://github.com/topjohnwu/Magisk/blob/master/scripts/util_functions.sh#L30
grep_prop() {
    REGEX="s/^$1=//p"
    shift
    FILES="$@"
    [ -z "$FILES" ] && FILES='/system/build.prop'
    cat $FILES 2>/dev/null | dos2unix | sed -n "$REGEX" | head -n 1
}