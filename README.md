# luci-app-cpu-status
CPU utilization info for the LuCI status page (OpenWrt webUI).

OpenWrt >= 19.07.

Simple version: [luci-app-cpu-status-mini](https://github.com/gSpotx2f/luci-app-cpu-status-mini).

**Installation notes:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status_0.2-4_all.ipk https://github.com/gSpotx2f/luci-app-cpu-status/raw/master/packages/19.07/luci-app-cpu-status_0.2-4_all.ipk
    opkg --force-overwrite install /tmp/luci-app-cpu-status_0.2-4_all.ipk
    rm /tmp/luci-app-cpu-status_0.2-4_all.ipk
    /etc/init.d/rpcd restart

**i18n-ru:**

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-ru_0.2-4_all.ipk https://github.com/gSpotx2f/luci-app-cpu-status/raw/master/packages/19.07/luci-i18n-cpu-status-ru_0.2-4_all.ipk
    opkg --force-overwrite install /tmp/luci-i18n-cpu-status-ru_0.2-4_all.ipk
    rm /tmp/luci-i18n-cpu-status-ru_0.2-4_all.ipk

**Screenshots:**

![](https://github.com/gSpotx2f/luci-app-cpu-status/blob/master/screenshots/01.jpg)
