#!/vendor/bin/sh
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

BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh

# 设置日志文件最大大小（单位MB）
MAX_LOG_SIZE_MB=5

. $BASEDIR/libgpugov.sh

wait_until_login

# 确保日志目录存在并设置适当权限
mkdir -p $LOG_PATH
mkdir -p $GAMES_PATH
# 设置日志目录权限为777，确保任何进程都可以写入
chmod 0777 $LOG_PATH
chmod 0777 $GAMES_PATH

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0666 "$LOG_LEVEL_FILE"
    log "Created log level file with default level: info"
fi

# 检查并轮转所有日志文件
# 先处理主日志文件
if [ -f "$GPUGOV_LOGPATH" ]; then
    # 强制轮转主日志文件，确保启动时日志文件不会太大
    cp "$GPUGOV_LOGPATH" "${GPUGOV_LOGPATH}.bak" 2>/dev/null
    true > "$GPUGOV_LOGPATH"
    chmod 0666 "$GPUGOV_LOGPATH"
    echo "$(date) - 系统启动时强制轮转日志，原日志已备份到 ${GPUGOV_LOGPATH}.bak" >> "$GPUGOV_LOGPATH"
    sync
fi

# 使用统一的日志轮转函数处理初始化日志
rotate_log "$LOG_FILE" "$MAX_LOG_SIZE_MB"

# 记录基本信息到日志
{
    echo "$(date)"
    echo "PATH=$PATH"
    echo "sh=$(which sh)"
    echo "Bootstraping MTK_GPU_GOVERNOR"

    # 记录当前日志等级
    if [ -f "$LOG_LEVEL_FILE" ]; then
        current_log_level=$(cat "$LOG_LEVEL_FILE")
        echo "Current log level: $current_log_level"
    else
        echo "Log level file not found, using default: info"
    fi
} >> "$LOG_FILE"

# 使用log_command函数执行gpugov_testconf，确保日志大小受控
log_command "$LOG_FILE" "gpugov_testconf"

# 检查并轮转GPU调速器主日志
rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
