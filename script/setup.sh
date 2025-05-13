#!/system/bin/sh
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
}

# 生成游戏列表配置文件
generate_gamelist() {
    echo "Searching for installed games and configuring games.conf"
    echo "* GPU Governor can enable game mode for applications in the game list *"

    echo ">> Adding preset games & benchmark applications"
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

    echo ">> Searching and adding Unity & UE4 engine based games"
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
      echo '>> Adding games recognized by SCENE'
      grep '="true"' /data/data/com.omarea.vtools/shared_prefs/games.xml | cut -f2 -d '"' | while read package
      do
        r=$(grep $package "$GAMES_FILE")
        if [[ "$r" == '' ]]; then
          echo " + $package"
          echo $package >> "$GAMES_FILE"
        fi
      done
    fi

    echo "- Game list configuration file generated: $GAMES_FILE"
}
install_gov() {
    echo "- ro.board.platform=$(getprop ro.board.platform)"
    echo "- ro.product.board=$(getprop ro.product.board)"

    target="$(getprop ro.board.platform)"
    cfgname="$(get_config_name $target)"

    # 特殊处理mt6983，可能是mt6891或mt6893
    if [ "$target" = "mt6983" ]; then
        # 如果CPU7最大频率小于2700000，则是mt6891
        if [ "$(get_maxfreq 7)" -lt 2700000 ]; then
            echo "- Detected mt6983 but CPU7 frequency is lower, identified as mt6891"
            cfgname="mtd1100"
        else
            echo "- Detected mt6983 with normal CPU7 frequency, identified as mt6893"
            cfgname="mtd1200"
        fi
    fi

    if [ "$cfgname" = "unsupported" ]; then
        target="$(getprop ro.product.board)"
        cfgname="$(get_config_name "$target")"
    fi
    if [ "$cfgname" = "unsupported" ] || [ ! -f "$MODULE_PATH"/config/"$cfgname".conf ]; then
        echo "! Target [$target] not supported. Using default configuration."
        # 使用模块目录下的默认配置文件
        cfgname="default"
    fi
    if [ "$cfgname" == "mt6983" ] || [ "$cfgname" == "mt6895" ];then
        touch "$MODULE_PATH"/USE_DEBUGFS
    fi
    mkdir -p "$LOG_PATH"
    mkdir -p "$GAMES_PATH"

    # 设置日志目录和游戏目录权限为777，确保任何进程都可以写入
    chmod 0777 "$LOG_PATH"
    chmod 0777 "$GAMES_PATH"
    if [ ! -f "$USER_PATH"/gpu_freq_table.conf ]; then
        #mv -f "$USER_PATH"/gpu_freq_table.conf "$USER_PATH"/gpu_freq_table.conf.bak
        if [ "$cfgname" = "default" ]; then
            # 使用模块目录下的默认配置文件
            cp -f "$MODULE_PATH"/gpu_freq_table.conf "$USER_PATH"/gpu_freq_table.conf
        else
            cp -f "$MODULE_PATH"/config/"$cfgname".conf "$USER_PATH"/gpu_freq_table.conf
        fi
        echo "- GPU Freq Table config is located at $USER_PATH/gpu_freq_table.conf"
    fi
    echo "- Logs will be stored in $LOG_PATH"

    # 创建游戏模式文件，初始值为0（关闭），如果已存在则不创建
    if [ ! -f "$GAME_MODE_FILE" ]; then
        echo "0" > "$GAME_MODE_FILE"
        chmod 0666 "$GAME_MODE_FILE"
        echo "- Game mode file created at $GAME_MODE_FILE"
    else
        echo "- Game mode file already exists at $GAME_MODE_FILE"
    fi

    # 创建日志等级文件，默认为info级别，如果已存在则不创建
    if [ ! -f "$LOG_LEVEL_FILE" ]; then
        echo "info" > "$LOG_LEVEL_FILE"
        chmod 0666 "$LOG_LEVEL_FILE"
        echo "- Log level file created at $LOG_LEVEL_FILE (default: info)"
    else
        echo "- Log level file already exists at $LOG_LEVEL_FILE"
    fi

    # 生成游戏列表配置文件
    generate_gamelist
}

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
