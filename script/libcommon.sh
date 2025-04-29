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