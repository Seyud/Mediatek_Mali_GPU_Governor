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
# 设置日志目录权限为777，确保任何进程都可以写入
chmod 0777 $LOG_PATH

# 使用统一的日志轮转函数处理初始化日志
rotate_log "$LOG_FILE" "$MAX_LOG_SIZE_MB"

# 记录基本信息到日志
{
    echo "$(date)"
    echo "PATH=$PATH"
    echo "sh=$(which sh)"
    echo "Bootstraping MTK_GPU_GOVERNOR"
} >> "$LOG_FILE"

# 使用log_command函数执行gpugov_testconf，确保日志大小受控
log_command "$LOG_FILE" "gpugov_testconf"

# 检查并轮转GPU调速器主日志
rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
