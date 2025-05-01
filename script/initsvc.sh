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

# 检查初始化日志文件大小
if [ -f "$LOG_FILE" ]; then
    # 获取文件大小（以字节为单位）
    file_size=$(stat -c %s "$LOG_FILE" 2>/dev/null || stat -f %z "$LOG_FILE" 2>/dev/null)
    max_size_bytes=$((MAX_LOG_SIZE_MB * 1024 * 1024))

    # 如果文件大小超过限制，进行备份
    if [ "$file_size" -gt "$max_size_bytes" ]; then
        cp -r $LOG_FILE $LOG_FILE.bak
        clear_log
        echo "$(date) - 日志已轮转，原日志已备份到 ${LOG_FILE}.bak" >> "$LOG_FILE"
    else
        cp -r $LOG_FILE $LOG_FILE.bak
        clear_log
    fi
else
    clear_log
fi
exec 1>>$LOG_FILE
exec 2>&1
date
echo "PATH=$PATH"
echo "sh=$(which sh)"
echo "Bootstraping MTK_GPU_GOVERNOR"
#All Logged
{
    gpugov_testconf
} >>$LOG_FILE 2>&1
