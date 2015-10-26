/*** Presence Z-Way HA module *******************************************

Version: 1.01
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: maros@k-1.com <maros@k-1.com>
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

Presence.prototype.devices = ['presence','vacation','night'];

Presence.prototype.init = function (config) {
    Presence.super_.prototype.init.call(this, config);

    var self = this;
    self.langFile = self.controller.loadModuleLang("Presence");

    this.createDevice('presence','on');
    this.createDevice('vacation','off');
    this.createDevice('night','off');
    
    this.initNightTimeout();
};

Presence.prototype.stop = function () {
    var self = this;
    
    _.each(self.devices,function(element) {
        var key = element + 'Dev';
        if (typeof(self[element]) !== 'undefined') {
            self.controller.devices.remove(self[elememt]);
            self[element] = undefined;
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
    
    var dateNow     = new Date();
    var dateCalc    = new Date();
    dateCalc.setHours(parseInt(match[0]), parseInt(match[1]));
    
    if (dateCalc < dateNow) {
        dateCalc.setHours(dateCalc.getHours() + 24);
        // Now fix time jump on DST
        dateCalc.setHours(match[0],match[1]);
    }
    
    return (dateCalc.getTime() - dateNow.getTime());
}

Presence.prototype.createDevice = function(type,defaultLevel) {
    var self = this;
    
    var handler = type.charAt(0).toUpperCase() + type.slice(1);
    var device  = self.controller.devices.create({
        deviceId: "Presence_"+type+"_" + this.id,
        defaults: {
            metrics: {
                probeTitle: type,
                title: self.langFile['title_'+type],
                level: defaultLevel,
                mode: 'present'
            }
        },
        overlay: {
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
    self[type+'Dev'] = device;
    
    var level = device.get('metrics:level');
    device.set('metrics:icon','/ZAutomation/api/v1/load/modulemedia/Presence/'+type+'_'+level+'.png');
    
    return device;
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
    
    var device      = self[type+'Dev'];
    var oldLevel    = device.get('metrics:level');
    if (typeof(oldMode) !== 'undefined' 
        && oldMode === newLevel) {
        return;
    }
    
    console.log('[Presence] Turning '+newLevel+' '+type);
    device.set('metrics:level',newLevel);
    device.set('metrics:icon','/ZAutomation/api/v1/load/modulemedia/Presence/'+type+'_'+newLevel+'.png');
    
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
    var mode;
    
    if (presence === 'on') {
        if (night === 'on'){
            mode = 'night';
        } else {
            mode = 'home';
        }
        // TODO check vacation?
    } else if (presence === 'off') {
        if (vacation === 'on') {
            mode = 'vacation';
        } else {
            mode = 'away';
        }
    }
    
    if (mode !== oldMode) {
        _.each(self.devices,function(element) {
            var key     = element + 'Dev';
            var device  = self[element];
            if (typeof(device) !== 'undefined') {
                device.set('metrics:mode',mode);
            }
        });
        
        self.controller.emit("presence."+mode);
    }
    
    self.initNightTimeout();
    
    return mode;
};
