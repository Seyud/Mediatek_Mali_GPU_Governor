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

# Runonce after boot, to speed up the transition of power modes in powercfg

BASEDIR="$(dirname $(readlink -f "$0"))"
MODULE_PATH=$MODPATH
. $BASEDIR/pathinfo.sh
. $BASEDIR/libsysinfo.sh

# $1:error_message
abort() {
    echo "$1"
    echo "! Installation failed."
    exit 1
}

# $1:file_node $2:owner $3:group $4:permission $5:secontext
set_perm() {
    local con
    chown $2:$3 $1
    chmod $4 $1
    con=$5
    [ -z $con ] && con=u:object_r:system_file:s0
    chcon $con $1
}

# $1:directory $2:owner $3:group $4:dir_permission $5:file_permission $6:secontext
set_perm_recursive() {
    find $1 -type d 2>/dev/null | while read dir; do
        set_perm $dir $2 $3 $4 $6
    done
    find $1 -type f -o -type l 2>/dev/null | while read file; do
        set_perm $file $2 $3 $5 $6
    done
}

set_permissions() {
    set_perm_recursive $BIN_PATH 0 0 0755 0755 u:object_r:system_file:s0
    set_perm_recursive "$MODULE_PATH"/system/vendor/etc 0 0 0755 0644 u:object_r:vendor_configs_file:s0
    set_perm_recursive "$MODULE_PATH"/zygisk 0 0 0755 0644 u:object_r:system_file:s0
}

# 生成游戏列表配置文件
generate_gamelist() {
    echo "查找安装的游戏，并配置games.conf"
    echo "* GPU调速器可以对游戏列表内的应用开启游戏模式*"

    echo ">> 添加预设游戏&基准测试程序"
    preset_games='xyz.aethersx2.android
org.ppsspp.ppsspp
org.ppsspp.ppssppgold
skyline.emu
com.xiaoji.gamesirnsemulator
com.futuremark.dmandroid.application
com.glbenchmark.glbenchmark27
com.antutu.benchmark.full
com.ioncannon.cpuburn.gpugflops

com.tencent.tmgp.cod
com.tencent.tmgp.pubgmhd
com.tencent.tmgp.pubgmhdce
com.tencent.ig
com.tencent.tmgp.sgame
com.tencent.tmgp.sgamece
com.tencent.tmgp.speedmobile
com.tencent.mf.uam
com.tencent.tmgp.cf
com.tencent.af
com.tencent.lolm
com.tencent.jkchess

com.miHoYo.Yuanshen
com.miHoYo.ys.mi
com.miHoYo.ys.bilibili
com.miHoYo.GenshinImpact
com.miHoYo.hkrpg
com.miHoYo.hkrpg.bilibili
com.HoYoverse.hkrpgoversea
com.mihoyo.bh3
com.mihoyo.bh3.mi
com.mihoyo.bh3.uc
com.miHoYo.bh3.wdj
com.miHoYo.bh3.bilibili
com.mojang.minecraftpe

com.tgc.sky.android
com.kiloo.subwaysurf
com.taptap

com.netease.sky
com.netease.moba.aligames
com.netease.party
com.netease.jddsaef
com.netease.g93na
com.netease.g93natw
com.netease.g93nagb

com.netease.mrzhna
com.netease.mrzh.nearme.gamecenter

com.dw.h5yvzr.yt
com.pwrd.hotta.laohu
com.hottagames.hotta.bilibili
com.hottagames.hotta.mi
com.hottagames.hotta.vivo

com.kurogame.mingchao
com.kurogame.wutheringwaves.global
com.dragonli.projectsnow.lhm
com.netease.aceracer
com.netease.race

com.activision.callofduty.warzone
com.MadOut.BIG'
    echo "$preset_games" > "$GAMES_FILE"

    echo ">> 查找并添加基于Unity&UE4引擎的游戏"
    pm list packages -3 | grep -v 'mobileqq' | cut -f2 -d ':' | while read package
    do
      path=$(pm path $package | cut -f2 -d ':')
      dir=${path%/*}
      libs="$dir/lib/arm64"
      if [[ -d $libs ]]; then
        game_libs=$(ls $libs | grep -E '(libunity.so|libUE3.so|libUE4.so)')
        if [[ "$game_libs" != '' ]] && [[ $(echo "$preset_games" | grep $package) == '' ]]; then
          echo " + $package"
          echo $package >> "$GAMES_FILE"
        fi
      fi
    done

    scene_games=/data/data/com.omarea.vtools/shared_prefs/games.xml
    if [[ -f $scene_games ]]; then
      echo '>> 添加SCENE识别的游戏'
      grep '="true"' /data/data/com.omarea.vtools/shared_prefs/games.xml | cut -f2 -d '"' | while read package
      do
        r=$(grep $package "$GAMES_FILE")
        if [[ "$r" == '' ]]; then
          echo " + $package"
          echo $package >> "$GAMES_FILE"
        fi
      done
    fi

    echo "- 游戏列表配置文件已生成: $GAMES_FILE"
}
install_gov() {
    echo "- ro.board.platform=$(getprop ro.board.platform)"
    echo "- ro.product.board=$(getprop ro.product.board)"

    target="$(getprop ro.board.platform)"
    cfgname="$(get_config_name $target)"
    if [ "$cfgname" = "unsupported" ]; then
        target="$(getprop ro.product.board)"
        cfgname="$(get_config_name "$target")"
    fi
    if [ "$cfgname" = "unsupported" ] || [ ! -f "$MODULE_PATH"/config/"$cfgname".conf ]; then
        abort "! Target [$target] not supported."
    fi
    if [ "$cfgname" == "mt6983" ] || [ "$cfgname" == "mt6895" ];then
        touch "$MODULE_PATH"/USE_DEBUGFS
    fi
    mkdir -p "$USER_PATH"
    mkdir -p "$LOG_PATH"
    mkdir -p "$GAMES_PATH"

    # 设置日志目录权限为777，确保任何进程都可以写入
    chmod 0777 "$LOG_PATH"
    chmod 0777 "$GAMES_PATH"
    if [ ! -f "$USER_PATH"/gpu_freq_table.conf ]; then
        #mv -f "$USER_PATH"/gpu_freq_table.conf "$USER_PATH"/gpu_freq_table.conf.bak
        cp -f "$MODULE_PATH"/config/"$cfgname".conf "$USER_PATH"/gpu_freq_table.conf
        echo "- GPU Freq Table config is located at $USER_PATH/gpu_freq_table.conf"
    fi
    echo "- Logs will be stored in $LOG_PATH"

    # 生成游戏列表配置文件
    generate_gamelist
}

#grep_prop comes from https://github.com/topjohnwu/Magisk/blob/master/scripts/util_functions.sh#L30
grep_prop() {
    REGEX="s/^$1=//p"
    shift
    FILES="$@"
    [ -z "$FILES" ] && FILES='/system/build.prop'
    cat $FILES 2>/dev/null | dos2unix | sed -n "$REGEX" | head -n 1
}

# get module version
module_version="$(grep_prop version "$MODULE_PATH"/module.prop)"
# get module name
module_name="$(grep_prop name "$MODULE_PATH"/module.prop)"
# get module id
#module_id="$(grep_prop id "$MODULE_PATH"/module.prop)"
# get module author
module_author="$(grep_prop author "$MODULE_PATH"/module.prop)"

echo ""
echo "* $module_name"
echo "* Author: $module_author"
echo "* Version: $module_version"
echo ""

echo "- Installing"

install_gov
set_permissions

echo "- Install Finished"
