# Zway-Presence

This module manages presence modes. Four different presence modes are available

* home (Home during daytime)
* night (Home during nighttime)
* away (Away - both day and night) 
* vacation (Prolonged absence - both day and night)

This information can then be used by other modules to create smart automation 
rules (eg. thermostat operation modes based on presence status) Whenever 
presence modes are switched an event will be emitted. Day/Night can be switched
either manually, or by configuring a time by which the switch should happen 
automatically.

# Configuration

## night_start, night_end

Lets you specify a time by which night mode should be activated/deactivated.
automatically. Manual switching regardless of the configured time is still 
possible.

# Events

Whenever presence mode change an event will be triggered

* presence.home
* presence.away
* presence.vacation
* presence.night
* presence.comehome (when switching from away or vacation to home or night)
* presence.leave (when switching from home or night to away or vacation)

# Virtual Devices

This module creates three virtual device switches to manage modes:

* Presence: Home or away
* Vacation: Longer absence
* Day/night

Additionally the calculated presence mode is stored in each device under 
metrics:mode.

# Installation

Install the BaseModule from https://github.com/maros/Zway-BaseModule first

The prefered way of installing this module is via the "Zwave.me App Store"
available in 2.2.0 and higher. For stable module releases no access token is 
required. If you want to test the latest pre-releases use 'k1_beta' as 
app store access token.

For developers and users of older Zway versions installation via git is 
recommended.

```shell
cd /opt/z-way-server/automation/userModules
git clone https://github.com/maros/Zway-Presence.git Presence --branch latest
```

To update or install a specific version
```shell
cd /opt/z-way-server/automation/userModules/Presence
git fetch --tags
# For latest released version
git checkout tags/latest
# For a specific version
git checkout tags/1.02
# For development version
git checkout -b master --track origin/master
```

# License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or any 
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
