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

# 使用传入的MODULE_DIR和SCRIPT_DIR变量
if [ -n "$MODULE_DIR" ] && [ -n "$SCRIPT_DIR" ]; then
    # 如果外部已经定义了这些变量，直接使用
    MODULE_PATH="$MODULE_DIR"
    SCRIPT_PATH="$SCRIPT_DIR"
else
    # 否则，使用更可靠的方式获取脚本目录
    CURRENT_PATH="$(dirname "$0")"
    if [ "$CURRENT_PATH" = "." ]; then
        CURRENT_PATH="$(pwd)"
    fi

    # 确保路径正确
    if [ "$(basename "$CURRENT_PATH")" = "script" ]; then
        # 如果当前脚本在script目录下，则模块目录是其父目录
        MODULE_PATH="$(dirname "$CURRENT_PATH")"
        SCRIPT_PATH="$CURRENT_PATH"
    else
        # 否则假设模块目录就是当前目录，script是其子目录
        MODULE_PATH="$CURRENT_PATH"
        SCRIPT_PATH="$MODULE_PATH/script"
    fi
fi

BIN_PATH="$MODULE_PATH/bin"
FLAG_PATH="$MODULE_PATH/flag"

# 记录路径信息到日志文件
if [ -n "$LOG_FILE" ]; then
    echo "MODULE_PATH=$MODULE_PATH" >> "$LOG_FILE"
    echo "SCRIPT_PATH=$SCRIPT_PATH" >> "$LOG_FILE"
    echo "BIN_PATH=$BIN_PATH" >> "$LOG_FILE"
    sync
fi

USER_PATH="/data"
LOG_PATH="/data/adb/gpu_governor/log"
LOG_FILE="$LOG_PATH/initsvc.log"
GAMES_PATH="/data/adb/gpu_governor"
GAMES_FILE="$GAMES_PATH/games.conf"
GAME_MODE_FILE="$GAMES_PATH/game_mode"
LOG_LEVEL_FILE="$GAMES_PATH/log_level"

###############################
# Log
###############################

# $1:content
log() {
    # 写入日志文件
    echo "$1" >>"$LOG_FILE"
    sync
}

clear_log() {
    true >"$LOG_FILE"
    sync
}
