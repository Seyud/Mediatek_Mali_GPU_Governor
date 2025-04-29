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
. $BASEDIR/libgpugov.sh
. $BASEDIR/libcorp.sh

wait_until_login

# 确保日志目录存在并设置适当权限
mkdir -p $LOG_PATH
# 设置日志目录权限为777，确保任何进程都可以写入
chmod 0777 $LOG_PATH

if [ -f "$LOG_FILE" ]; then
    cp -r $LOG_FILE $LOG_FILE.bak
fi
clear_log
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
