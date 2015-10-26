# Zway-Presence

This module manages presence modes. It can be used by other automation modules
(ie. thermostat control) to control smart home automation behaviour.

Four different presence modes are available

* home
* away
* vacation
* night

# Configuration

## night_start, night_end

Lets you specify a time by which night mode should be activated/deactivated.
Manual switching regardless of the configured time is still possible.

# Events

Whenever presence mode change an event will be triggered

* presence.home
* presence.away
* presence.vacation
* presence.night

# Virtual Devices

This module creates three virtual device switches to manage modes:

* Presence: Home or away
* Vacation: Longer absence
* Day/night

Additionally presence mode is stored in each device under metrics:mode.

# Installation

```shell
cd /opt/z-way-server/automation/modules
git clone https://github.com/maros/Zway-Presence.git Presence --branch latest
```

To update or install a specific version
```shell
cd /opt/z-way-server/automation/modules/Presence
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
