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

CURRENT_PATH="$(dirname $(readlink -f "${BASH_SOURCE:-$0}"))"
MODULE_PATH="${CURRENT_PATH%\/script}"
SCRIPT_PATH="$MODULE_PATH/script"
BIN_PATH="$MODULE_PATH/bin"
FLAG_PATH="$MODULE_PATH/flag"

USER_PATH="/data"
LOG_PATH="/data/adb/gpu_governor/log"
LOG_FILE="$LOG_PATH/initsvc.log"
GAMES_PATH="/data/adb/gpu_governor"
GAMES_FILE="$GAMES_PATH/games.conf"
GAME_MODE_FILE="$GAMES_PATH/game_mode"

###############################
# Log
###############################

# $1:content
log() {
    echo "$1" >>"$LOG_FILE"
    sync
}

clear_log() {
    true >"$LOG_FILE"
    sync
}

