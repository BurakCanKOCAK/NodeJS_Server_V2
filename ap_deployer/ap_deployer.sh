#
# Sample configuration file for ISC dhcpd for Debian
#
# $Id: dhcpd.conf,v 1.1.1.1 2002/05/21 00:07:44 peloy Exp $
#

# The ddns-updates-style parameter controls whether or not the server will
# attempt to do a DNS update when a lease is confirmed. We default to the
# behavior of the version 2 packages ('none', since DHCP v2 didn't
# have support for DDNS.)
ddns-update-style none;

default-lease-time 600;
max-lease-time 7200;

log-facility local7;

option domain-name "ChanaMasala.local";
option domain-name-servers dns.ChanaMasala.local;
default-lease-time 600;
max-lease-time 7200;
authoritative;
log-facility local7;
subnet 192.168.100.0 netmask 255.255.255.0
{ range 192.168.100.100 192.168.100.200; }



#!/bin/bash
echo "run as root" | figlet
apt-get -y install hostapd isc-dhcp-server

cat >> /etc/network/interfaces <<DELIM
allow-hotplug wlan0
iface wlan0 inet static
address 192.168.100.1
netmask 255.255.255.0
DELIM

cat > /etc/hostapd/hostapd.conf <<DELIM
interface=wlan0
driver=nl80211
ssid=Pedal_interface
hw_mode=g
channel=6
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=yamsaregood
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
DELIM

cp /etc/default/hostapd /etc/default/hostapd.orig
cat /etc/default/hostapd.orig | sed 's|#DAEMON_CONF="/etc/hostapd.conf"|DAEMON_CONF="/etc/hostapd/hostapd.conf"|g' > /etc/default/hostapd

if [ -f /etc/dhcp/dhcpd.conf ]
then
  cp /etc/dhcp/dhcpd.conf /etc/dhcp/dhcpd.conf.orig
fi
cat > /etc/dhcp/dhcpd.conf <<DELIM
option domain-name "Pedal_interface.local";
option domain-name-servers dns.Pedal_interface.local;
default-lease-time 600;
max-lease-time 7200;
authoritative;
log-facility local7;
subnet 192.168.100.0 netmask 255.255.255.0 {
range 192.168.100.100 192.168.100.200;    <-- clients will get IP addresses in this range
}

DELIM

(for i in $(seq 100 200); do echo 192.168.100.$i client$i; done) >> /etc/hosts

reboot
#check dhcpd config with
#dhcpd -t -cf /path/to/dhcpd.conf