#!/system/bin/sh
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

MODDIR=${0%/*}

async_rescue() {
    if [ -f "$MODDIR/need_recuser" ]; then
        rm -f "$MODDIR"/need_recuser
        true >"$MODDIR"/disable
        sync
    else
        true >$MODDIR/need_recuser
        rm "$MODDIR"/disable
        sync
    fi
}
async_rescue
do_others() {
    rmdir /dev/cpuset/background/untrustedapp
    if [ -f $MODDIR/USE_DEBUGFS ];then
        mount -t debugfs none /sys/kernel/debug
    fi
}
do_others
