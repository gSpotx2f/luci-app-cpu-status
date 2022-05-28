# luci-app-cpu-status
CPU utilization info for the LuCI status page (OpenWrt webUI).

OpenWrt >= 19.07.

Lite version: [luci-app-cpu-status-mini](https://github.com/gSpotx2f/luci-app-cpu-status-mini).

## Installation notes

**OpenWrt >= 21.02:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status_0.4-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-cpu-status_0.4-1_all.ipk
    opkg install /tmp/luci-app-cpu-status_0.4-1_all.ipk
    rm /tmp/luci-app-cpu-status_0.4-1_all.ipk
    /etc/init.d/rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-ru_0.4-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-cpu-status-ru_0.4-1_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-ru_0.4-1_all.ipk
    rm /tmp/luci-i18n-cpu-status-ru_0.4-1_all.ipk

**OpenWrt 19.07:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status_0.3-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-app-cpu-status_0.3-1_all.ipk
    opkg install /tmp/luci-app-cpu-status_0.3-1_all.ipk
    rm /tmp/luci-app-cpu-status_0.3-1_all.ipk
    /etc/init.d/rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-ru_0.3-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-i18n-cpu-status-ru_0.3-1_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-ru_0.3-1_all.ipk
    rm /tmp/luci-i18n-cpu-status-ru_0.3-1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-status/blob/master/screenshots/01.jpg)

## Related LuCI applications:

CPU performance: [https://github.com/gSpotx2f/luci-app-cpu-perf](https://github.com/gSpotx2f/luci-app-cpu-perf).
