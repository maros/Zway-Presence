/*** Presence Z-Way HA module *******************************************

Version: 1.00
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: maros@k-1.com <maros@k-1.com>
Description:
    Module to set and display presence modes.

******************************************************************************/

function Presence (id, controller) {
    // Call superconstructor first (AutomationModule)
    Presence.super_.call(this, id, controller);
    
    self.presenceDev    = undefined;
    self.vacationDev    = undefined;
    self.daynightDev    = undefined;
}

inherits(Presence, AutomationModule);

_module = Presence;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Presence.prototype.init = function (config) {
    Presence.super_.prototype.init.call(this, config);

    var self = this;
    var langFile = self.controller.loadModuleLang("Presence");

    // Create presence dev
    this.presenceDev = this.controller.devices.create({
        deviceId: "Presence_Main_" + this.id,
        defaults: {
            metrics: {
                title: langFile.title_presence,
                level: 'on'
            }
        },
        overlay: {
            deviceType: 'binarySwitch'
        },
        handler: function(command) {
            if (command === 'on'
                || command === 'off') {
                self.switchPresence(command);
            }
        },
        moduleId: this.id
    });
    
    // Create vacation dev
    this.vacationDev = this.controller.devices.create({
        deviceId: "Presence_Vacation_" + this.id,
        defaults: {
            metrics: {
                title: langFile.title_holiday,
                level: 'off'
            }
        },
        overlay: {
            deviceType: 'binarySwitch'
        },
        handler: function(command) {
            if (command === 'on'
                || command === 'off') {
                self.switchHoliday(command);
            }
        },
        moduleId: this.id
    });

    this.daynightDev = this.controller.devices.create({
        deviceId: "Presence_DayNight_" + this.id,
        defaults: {},
        overlay: {
            deviceType: 'toggleSwitch'
        },
        handler: function(command) {
            if (command === 'on'
                || command === 'off') {
                self.switchDaynight(command);
            }
        },
        moduleId: this.id

    });
};


Presence.prototype.stop = function () {
    var self = this;
    
    _.each(['presence','vacation','daynight'],function(element) {
        var key = element + 'Dev';
        if (typeof(self[element]) {
            self.controller.devices.remove(self[elememt]);
            self[element] = undefined;
        }
    });
    
    Presence.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Presence.prototype.switchPresence = function(newPresence) {};
Presence.prototype.switchVacation = function(newVacation) {};
Presence.prototype.switchDayNight = function(newDayNight) {};

