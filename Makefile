#
# Copyright (C) 2020 gSpot (https://github.com/gSpotx2f/luci-app-cpu-status)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_VERSION:=0.2
PKG_RELEASE:=4
LUCI_TITLE:=CPU utilization info for the LuCI status page
LUCI_DEPENDS:=+luci-mod-admin-full
LUCI_PKGARCH:=all
PKG_LICENSE:=MIT

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
