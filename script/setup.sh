#!/system/bin/sh
BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh
. $BASEDIR/libsysinfo.sh

# $1:error_message_zh $2:error_message_en
abort() {
    echo "❌ $(translate "$1" "$2")"
    echo "❌ $(translate "安装失败。" "Installation failed.")"
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
    find $1 -type d 2> /dev/null | while read dir; do
        set_perm $dir $2 $3 $4 $6
    done
    find $1 -type f -o -type l 2> /dev/null | while read file; do
        set_perm $file $2 $3 $5 $6
    done
}

set_permissions() {
    set_perm_recursive $BIN_PATH 0 0 0755 0755 u:object_r:system_file:s0
}

cleanup_docs_by_language() {
    local lang="$language"
    local targets=""

    case "$lang" in
        zh)
            targets="$(cat <<EOF
$MODULE_PATH/docs/en
EOF
)"
            ;;
        en)
            targets="$(cat <<EOF
$MODULE_PATH/docs/*.md
EOF
)"
            ;;
        *)
            return
            ;;
    esac

    printf '%s\n' "$targets" | while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        for path in $entry; do
            if [ -e "$path" ] || [ -L "$path" ]; then
                rm -rf "$path" 2> /dev/null
            fi
        done
    done
}

# 复制GPU频率表文件的函数
copy_gpu_freq_table() {
    if [ "$cfgname" != "default" ] && [ -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" ]; then
        cp -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" "$GPU_FREQ_TABLE_TOML_FILE"
        chmod 0666 "$GPU_FREQ_TABLE_TOML_FILE"
        echo "$(translate "📈 GPU频率表已创建于" "📈 GPU frequency table created at") $GPU_FREQ_TABLE_TOML_FILE"
    elif [ -f "$MODULE_GPU_FREQ_TABLE_FILE" ]; then
        cp -f "$MODULE_GPU_FREQ_TABLE_FILE" "$GPU_FREQ_TABLE_TOML_FILE"
        chmod 0666 "$GPU_FREQ_TABLE_TOML_FILE"
        echo "$(translate "📈 默认GPU频率表已创建于" "📈 Default GPU frequency table created at") $GPU_FREQ_TABLE_TOML_FILE"
    else
        echo "$(translate "⚠️ GPU频率表文件，跳过创建" "⚠️ GPU frequency table file not found, skipping creation")"
    fi
}

append_game_entry() {
    local package="$1"
    [ -z "$package" ] && return
    {
        printf '\n'
        printf '[[games]]\n'
        printf 'package = "%s"\n' "$package"
        printf 'mode = "balance"\n\n'
    } >> "$GAME_LIST"
}

add_game_if_missing() {
    local package="$1"
    [ -z "$package" ] && return
    if ! grep -Fq "package = \"$package\"" "$GAME_LIST" 2> /dev/null; then
        echo " + $package"
        append_game_entry "$package"
    fi
}

# 生成游戏列表
generate_gamelist() {
    local preset_games_list
    preset_games_list="$(cat <<'EOF' | sed 's/^[[:space:]]*//'
        xyz.aethersx2.android
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
        com.MadOut.BIG
EOF
)"

    echo "$(translate "🔍 开始搜索已安装游戏并生成游戏列表" "🔍 Starting to search for installed games and generate game list")"
    echo "$(translate "🎯 正在搜索并添加基于Unity和UE4引擎的游戏" "🎯 Searching and adding Unity & UE4 engine based games")"
    pm list packages -3 | grep -v 'mobileqq' | cut -f2 -d ':' | while read -r package; do
        path=$(pm path "$package" | head -n 1 | cut -f2 -d ':')
        [ -z "$path" ] && continue
        dir=${path%/*}
        libs="$dir/lib/arm64"
        if [ -d "$libs" ]; then
            game_libs=$(ls "$libs" 2> /dev/null | grep -E '(libunity.so|libUE3.so|libUE4.so)')
            if [ -n "$game_libs" ]; then
                if ! printf '%s\n' "$preset_games_list" | grep -Fxq "$package"; then
                    add_game_if_missing "$package"
                fi
            fi
        fi
    done

    scene_games=/data/data/com.omarea.vtools/shared_prefs/games.xml
    if [[ -f $scene_games ]]; then
        echo "$(translate "🎲 添加被SCENE识别的游戏" "🎲 Adding games recognized by SCENE")"
        grep '="true"' "$scene_games" | cut -f2 -d '"' | while read package; do
            add_game_if_missing "$package"
        done
    fi
    
    echo "$(translate "📋 添加预设游戏和基准测试应用" "📋 Adding preset games & benchmark applications")"

    echo "# GPU调速器游戏列表" > "$GAME_LIST"
    echo "" >> "$GAME_LIST"

    printf '%s\n' "$preset_games_list" | while read -r package; do
        append_game_entry "$package"
    done
    echo "$(translate "📝 游戏列表已生成：" "📝 Game list generated:") $GAME_LIST"
    echo "$(translate "🎮 GPU调速器可以为游戏列表中的应用启用游戏模式 🎮" "🎮 GPU Governor can enable game mode for applications in the game list 🎮")"
}

determine_cfgname_by_target() {
    local detected_cfgname
    detected_cfgname="$(get_config_name "$1")"

    case "$1" in
        mt6893)
            if [ "$(get_maxfreq 7)" -lt 2700000 ]; then
                echo "$(translate "🔍 检测到mt6893但CPU7频率较低，判断为mt6891" "🔍 Detected mt6893 but CPU7 frequency is lower, identified as mt6891")"
                detected_cfgname="mtd1100"
            else
                echo "$(translate "🔍 检测到mt6893且CPU7频率正常，判断为mt6893" "🔍 Detected mt6893 with normal CPU7 frequency, identified as mt6893")"
                detected_cfgname="mtd1200"
            fi
            ;;
        mt6895)
            if [[ $(getprop ro.soc.model | grep 6896) != '' ]]; then
                echo "$(translate "🔍 检测到mt6895但ro.soc.model包含6896，判断为mt6896" "🔍 Detected mt6895 but ro.soc.model contains 6896, identified as mt6896")"
                detected_cfgname="mtd8200"
            fi
            ;;
    esac

    echo "$detected_cfgname"
}

resolve_cfgname() {
    local target_platform="$1"
    local cfg="$(determine_cfgname_by_target "$target_platform")"

    if [ "$cfg" = "unsupported" ]; then
        target_platform="$(getprop ro.product.board)"
        cfg="$(determine_cfgname_by_target "$target_platform")"
    fi

    GPU_FREQ_TABLE_TEMPLATE_FILE="$MODULE_CONFIG_PATH/$cfg.toml"

    if [ "$cfg" = "unsupported" ] || [ ! -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" ]; then
        if [ "$(is_mtk)" = "true" ]; then
            echo "$(translate "⚠️ 目标设备 [$target_platform] 是MTK设备但没有专用配置，使用默认配置。" "⚠️ Target [$target_platform] is MTK device but no specific config found, using default configuration.")"
            cfg="default"
            GPU_FREQ_TABLE_TEMPLATE_FILE="$MODULE_PATH/config/$cfg.toml"
        else
            abort "目标设备 [$target_platform] 不受支持，仅支持联发科(MTK)芯片。" "Target [$target_platform] not supported. Only supports MediaTek(MTK) chips."
        fi
    fi

    cfgname="$cfg"
}

prepare_directories() {
    mkdir -p "$GPU_LOG" "$GPU_GAME" "$GPU_CONFIG"
    chmod 0644 "$GPU_LOG" "$GPU_GAME" "$GPU_CONFIG"
}

handle_existing_gpu_freq_table() {
    if [ ! -f "$GPU_FREQ_TABLE_TOML_FILE" ]; then
        copy_gpu_freq_table
        return
    fi

    echo "$(translate "⚠️ 发现已存在的GPU频率表" "⚠️ Found existing GPU frequency table")"
    echo "$(translate "🔄 是否使用旧的频率表？（若不使用则自动备份）" "🔄 Do you want to use the old frequency table? (If not, it will be automatically backed up)")"
    echo "$(translate "🔊 （音量上键 = 是, 音量下键 = 否，10秒无操作 = 是）" "🔊 (Volume Up = Yes, Volume Down = No, 10s no input = Yes)")"

    TMPDIR="/data/local/tmp"
    mkdir -p "$TMPDIR" 2> /dev/null
    START_TIME=$(date +%s)
    while true; do
        NOW_TIME=$(date +%s)
        timeout 1 getevent -lc 1 2>&1 | grep KEY_VOLUME > "$TMPDIR/events"
        if [ $((NOW_TIME - START_TIME)) -gt 9 ]; then
            echo "$(translate "⏰ 10秒无输入，默认使用旧频率表。" "⏰ No input detected after 10 seconds, defaulting to use old frequency table.")"
            break
        elif $(cat $TMPDIR/events 2> /dev/null | grep -q KEY_VOLUMEUP); then
            echo "$(translate "🔼 检测到音量上键，使用旧频率表。" "🔼 Volume Up detected, using old frequency table.")"
            break
        elif $(cat $TMPDIR/events 2> /dev/null | grep -q KEY_VOLUMEDOWN); then
            echo "$(translate "🔽 检测到音量下键，使用新频率表。" "🔽 Volume Down detected, using new frequency table.")"
            cp -f "$GPU_FREQ_TABLE_TOML_FILE" "$GPU_FREQ_TABLE_TOML_FILE.bak"
            echo "$(translate "💾 旧频率表已备份至" "💾 Old frequency table backed up to") $GPU_FREQ_TABLE_TOML_FILE.bak"
            copy_gpu_freq_table
            break
        fi
    done
}

ensure_log_level_file() {
    if [ ! -f "$LOG_LEVEL_FILE" ]; then
        echo "info" > "$LOG_LEVEL_FILE"
        chmod 0666 "$LOG_LEVEL_FILE"
        echo "$(translate "📝 日志等级文件已创建于" "📝 Log level file created at") $LOG_LEVEL_FILE $(translate "（默认：info）" "(default: info)")"
    else
        echo "$(translate "📝 日志等级文件已存在于" "📝 Log level file already exists at") $LOG_LEVEL_FILE"
    fi
}

ensure_config_file() {
    if [ -f "$CONFIG_TOML_FILE" ]; then
        echo "$(translate "⚙️ 自定义配置已存在于" "⚙️ Custom config file already exists at") $CONFIG_TOML_FILE"
    elif [ -f "$DEFAULT_CONFIG_FILE" ]; then
        cp -f "$DEFAULT_CONFIG_FILE" "$CONFIG_TOML_FILE"
        chmod 0666 "$CONFIG_TOML_FILE"
        echo "$(translate "⚙️ 自定义配置已创建于" "⚙️ Custom config file created at") $CONFIG_TOML_FILE"
    else
        echo "$(translate "⚠️ 默认自定义配置不存在，跳过创建" "⚠️ Default custom config does not exist, skipping creation")"
    fi
}

ensure_game_list() {
    if [ -f "$GAME_LIST" ]; then
        echo "$(translate "🎮 游戏列表已存在，跳过生成" "🎮 Game list already exists, skipping generation") $GAME_LIST"
    else
        generate_gamelist
    fi
}

install_gov() {
    echo "$(translate "📱 设备平台：" "📱 Device platform:") $(getprop ro.board.platform)"
    echo "$(translate "📱 产品主板：" "📱 Product board:") $(getprop ro.product.board)"
    resolve_cfgname "$target"

    prepare_directories

    echo "$(translate "📊 日志将存储在" "📊 Logs will be stored in") $GPU_LOG"

    ensure_log_level_file
    handle_existing_gpu_freq_table
    ensure_config_file
    ensure_game_list
}

init_language
echo ""
echo "🚀 $(translate "$module_name" "$module_id")"
echo "$(translate "👨‍💻 作者：$module_author" "👨‍💻 Author: $module_author")"
echo "$(translate "📌 版本：" "📌 Version:") $module_version"
check_conflicting_processes
echo ""
echo "⚠️ $(translate "如果在使用过程中出现死机，异常卡顿，可能是电压过低导致，请自行修改电压至适合档位" "If you experience crashes or abnormal lag during usage, it may be caused by voltage being too low. Please adjust the voltage to appropriate levels yourself") ⚠️"
echo ""
echo "$(translate "🔄 正在安装..." "🔄 Installing...")"
cleanup_docs_by_language
install_gov
set_permissions
echo ""
echo "$(translate "👉 欢迎加入调速器测试🐧QQ群：719872309 或 TG群组：https://t.me/MTK_GPU" "👉 Join our Telegram channel: https://t.me/Mediatek_Mali_GPU_Governor")"
echo ""
echo "$(translate "✅ 安装完成！" "✅ Installation completed!")"
