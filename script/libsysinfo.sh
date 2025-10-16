#!/system/bin/sh

###############################
# MTK Platform info functions
###############################

# $1:"4.14" return:string_in_version
match_linux_version() {
    echo "$(cat /proc/version | grep -i "$1")"
}

get_socid() {
    if [ -f /sys/devices/soc0/soc_id ]; then
        echo "$(cat /sys/devices/soc0/soc_id)"
    else
        echo "$(cat /sys/devices/system/soc/soc0/id)"
    fi
}

get_nr_core() {
    echo "$(cat /proc/stat | grep cpu[0-9] | wc -l)"
}

# $1:cpuid
get_maxfreq() {
    echo "$(cat "/sys/devices/system/cpu/cpu$1/cpufreq/cpuinfo_max_freq")"
}

is_aarch64() {
    if [ "$(getprop ro.product.cpu.abi)" == "arm64-v8a" ]; then
        echo "true"
    else
        echo "false"
    fi
}

is_eas() {
    if [ "$(grep sched /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors)" != "" ]; then
        echo "true"
    else
        echo "false"
    fi
}

is_mtk() {
    local soc_model="$(getprop ro.soc.model)"
    local hw_check="$(getprop ro.hardware)
                    $(getprop ro.board.platform)
                    $(getprop ro.boot.hardware)
                    $(getprop ro.soc.manufacturer)
                    $soc_model"

    local pattern='(mt[0-9]{4}|mediatek|dimensity|helio[ _-]g?[0-9]{2})'

    echo "$hw_check" | tr '[:upper:]' '[:lower:]' | grep -qE "$pattern"

    [ $? -eq 0 ] && echo "true" || echo "false"
}

# 区分mt6891和mt6893
_get_mt689x_type() {
    # 如果是mt6893但CPU7最大频率小于2700000，则实际是mt6891
    if [ "$(get_maxfreq 7)" -lt 2700000 ]; then
        echo "mtd1100" # mt6891
    else
        echo "mtd1200" # mt6893
    fi
}

# $1:board_name
get_config_name() {
    case "$1" in
        "mt6765") echo "mtp35" ;; # Helio P35(mt6765)/G35(mt6765g)/G37(mt6765h)
        "mt6768") echo "mtg80" ;; # Helio P65(mt6768)/G70(mt6769v)/G80(mt6769t)/G85(mt6769z)
        "mt6785") echo "mtg90t" ;;
        "mt6833") echo "mtd720" ;;
        "mt6833p") echo "mtd720" ;; # Dimensity 810
        "mt6833v") echo "mtd720" ;; # Dimensity 810
        "mt6853") echo "mtd720" ;;
        "mt6873") echo "mtd820" ;;
        "mt6875") echo "mtd820" ;;
        "mt6877") echo "mtd920" ;;
        "mt6885") echo "mtd1000" ;;
        "mt6889") echo "mtd1000" ;;
        "mt6891") echo "mtd1100" ;;
        "mt6893") echo "$(_get_mt689x_type)" ;; # 使用CPU7频率区分mt6891和mt6893
        "mt6895") echo "mtd8100" ;;
        "mt6896") echo "mtd8200" ;;
        "mt6897") echo "mtd8300" ;;
        "mt6983") echo "mtd9000" ;;
        "mt6985") echo "mtd9200" ;;
        "mt6989") echo "mtd9300" ;; # Dimensity 9300
        "mt6991") echo "mtd9400" ;; # Dimensity 9400
        *) echo "unsupported" ;;
    esac
}
