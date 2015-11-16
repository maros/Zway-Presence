/*** Presence Z-Way HA module *******************************************

Version: 1.04
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: Maroš Kollár <maros@k-1.com>
Description:
    Module to set and display presence modes.

******************************************************************************/

function Presence (id, controller) {
    // Call superconstructor first (AutomationModule)
    Presence.super_.call(this, id, controller);
    
    this.presenceDev        = undefined;
    this.vacationDev        = undefined;
    this.nightDev           = undefined;
    this.langFile           = undefined;
    this.nightTimeout       = undefined;
}

inherits(Presence, AutomationModule);

_module = Presence;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Presence.prototype.subDevices = ['presence','vacation','night'];
Presence.prototype.states = ['home','night','away','vacation'];

Presence.prototype.init = function (config) {
    Presence.super_.prototype.init.call(this, config);

    var self = this;
    self.langFile = self.controller.loadModuleLang("Presence");

    self.presenceDev = self.createDevice('presence','on');
    self.vacationDev = self.createDevice('vacation','off');
    self.nightDev = self.createDevice('night','off');
    
    self.initNightTimeout();
};

Presence.prototype.stop = function () {
    var self = this;
    
    _.each(self.subDevices,function(element) {
        var key = element + 'Dev';
        if (typeof(self[key]) !== 'undefined') {
            self.controller.devices.remove(self[key]);
            self[key] = undefined;
        }
    });
    
    self.clearNightTimeout();
    
    Presence.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Presence.prototype.calcTimeout = function(timeString) {
    var self = this;
    
    if (typeof(timeString) !== 'string') {
        return;
    }
    
    var match = timeString.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) {
        return;
    }
    var hour        = parseInt(match[1]);
    var minute      = parseInt(match[2]);
    var dateNow     = new Date();
    var dateCalc    = new Date();
    dateCalc.setHours(hour, minute);
    
    if (dateCalc < dateNow) {
        dateCalc.setHours(dateCalc.getHours() + 24);
        // Now fix time jump on DST
        dateCalc.setHours(hour,minute);
    }
    
    return (dateCalc.getTime() - dateNow.getTime());
};

Presence.prototype.createDevice = function(type,defaultLevel) {
    var self = this;
    
    var probeTitle = type.charAt(0).toUpperCase() + type.slice(1);
    var deviceObject  = self.controller.devices.create({
        deviceId: "Presence_"+type+"_" + this.id,
        defaults: {
            metrics: {
                probeTitle: probeTitle,
                title: self.langFile['title_'+type],
                level: defaultLevel,
                mode: 'home'
            }
        },
        overlay: {
            metrics: {
                probeTitle: probeTitle
            },
            deviceType: 'switchBinary'
        },
        handler: function(command,args) {
            if (command !== 'on' && command !== 'off') {
                return;
            }
            self.switchMode(type,command);
        },
        moduleId: self.id
    });
    
    var level = deviceObject.get('metrics:level');
    deviceObject.set('metrics:icon','/ZAutomation/api/v1/load/modulemedia/Presence/'+type+'_'+level+'.png');
    
    return deviceObject;
};

Presence.prototype.switchPresence = function(command) {
    this.switchMode(self.presenceDev,command);
};

Presence.prototype.switchVacation = function(command) {
    this.switchMode(self.vacationDev,command);
};

Presence.prototype.switchNight = function(command) {
    this.switchMode(self.nightDev,command);
};

Presence.prototype.switchMode = function(type,newLevel) {
    var self = this;
    
    var deviceObject    = self[type+'Dev'];
    var oldLevel        = deviceObject.get('metrics:level');
    if (typeof(oldMode) !== 'undefined' 
        && oldMode === newLevel) {
        return;
    }
    
    console.log('[Presence] Turning '+newLevel+' '+type);
    deviceObject.set('metrics:level',newLevel);
    deviceObject.set('metrics:icon','/ZAutomation/api/v1/load/modulemedia/Presence/'+type+'_'+newLevel+'.png');
    
    self.calcMode(type);
};

Presence.prototype.clearNightTimeout = function() {
    var self = this;
    
    if (typeof(self.nightTimeout) !== 'undefined') {
        clearTimeout(self.nightTimeout);
        self.nightTimeout = undefined;
    }
};

Presence.prototype.initNightTimeout = function() {
    var self = this;
    
    self.clearNightTimeout();
    
    var night = self.nightDev.get('metrics:level');
    
    if (night === 'on') {
        var timeout = self.calcTimeout(self.config.night_end);
        self.nightTimeout = setTimeout(
            _.bind(self.switchMode,self,'night','off'),
            timeout
        );
    } else if (night === 'off') {
        var timeout = self.calcTimeout(self.config.night_start);
        self.nightTimeout = setTimeout(
            _.bind(self.switchMode,self,'night','on'),
            timeout
        );
    }
};

Presence.prototype.calcMode = function(type) {
    var self = this;
    
    var presence    = self.presenceDev.get('metrics:level');
    var night       = self.nightDev.get('metrics:level');
    var vacation    = self.vacationDev.get('metrics:level');
    var oldMode     = self.presenceDev.get('metrics:mode');
    var newMode;
    
    if (presence === 'on') {
        if (night === 'on'){
            newMode = 'night';
        } else {
            newMode = 'home';
        }
        // TODO check vacation?
    } else if (presence === 'off') {
        if (vacation === 'on') {
            newMode = 'vacation';
        } else {
            newMode = 'away';
        }
    }
    
    if (newMode !== oldMode) {
        self.presenceDev.set('metrics:mode',newMode);
        self.vacationDev.set('metrics:mode',newMode);
        self.nightDev.set('metrics:mode',newMode);
        self.controller.emit("presence."+newMode);
        
        var oldPresence = (oldMode === 'home' || oldMode === 'night') ? true:false;
        var newPresence = (newMode === 'home' || newMode === 'night') ? true:false;
        if (oldPresence !== newPresence) {
            self.controller.emit("presence."+(newPresence ? 'comehome':'leave'));
        }
    }
    
    self.initNightTimeout();
    
    return newMode;
};
