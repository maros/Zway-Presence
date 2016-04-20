/*** Presence Z-Way HA module *******************************************

Version: 1.1
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

inherits(Presence, BaseModule);

_module = Presence;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Presence.prototype.subDevices = ['presence','vacation','night'];

Presence.prototype.init = function (config) {
    Presence.super_.prototype.init.call(this, config);

    var self = this;

    self.presenceDev    = self.createDevice('presence','on');
    self.vacationDev    = self.createDevice('vacation','off');
    self.nightDev       = self.createDevice('night','off');
    
    _.each(['nightStart','nightEnd'],function(timeString) {
        if (typeof(self.config[timeString]) !== 'undefined'
            && self.config[timeString] !== '') {
            var date        = self.parseTime(self.config[timeString]);
            self.log('Switch '+timeString+' at '+date.getHours()+':'+date.getMinutes());
            self.controller.emit("cron.addTask","Presence."+timeString, {
                minute:     date.getMinutes(),
                hour:       date.getHours(),
                weekDay:    null,
                day:        null,
                month:      null
            });
        }
    });
    
    controller.on('Presence.nightStart',function() {
        self.switchMode('night','on');
    });
    
    controller.on('Presence.nightEnd',function() {
        self.switchMode('night','off');
    });
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
    
    Presence.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Presence.prototype.calcTimeout = function(timeString) {
    var self = this;
    
    var dateNow     = new Date();
    var dateCalc    = self.parseTime(timeString);
    
    if (typeof(dateCalc) === 'undefined') {
        return;
    }
    
    if (dateCalc < dateNow) {
        var hour    = dateCalc.getHours();
        var minute  = dateCalc.getMinutes();
        dateCalc.setHours(hour + 24);
        // Now fix time jump on DST
        dateCalc.setHours(hour,minute);
    }
    
    return (dateCalc.getTime() - dateNow.getTime());
};

Presence.prototype.createDevice = function(type,defaultLevel) {
    var self = this;
    
    var probeType = type.toLowerCase();
    var deviceObject  = self.controller.devices.create({
        deviceId: "Presence_"+type+"_" + this.id,
        defaults: {
            metrics: {
                title: self.langFile['title_'+type],
                level: defaultLevel,
                mode: 'home'
            }
        },
        overlay: {
            probeType: probeType,
            deviceType: 'switchBinary'
        },
        handler: function(command,args) {
            if (command !== 'on' && command !== 'off') {
                return;
            }
            self.log('Switch '+type+' via vDev');
            self.switchMode(type,command);
        },
        moduleId: self.id
    });
    
    var level = deviceObject.get('metrics:level');
    deviceObject.set('metrics:icon',self.imagePath+'/'+type+'_'+level+'.png');
    
    return deviceObject;
};

Presence.prototype.switchPresence = function(command) {
    self.log('Switch presence via method');
    this.switchMode('presence',command);
};

Presence.prototype.switchVacation = function(command) {
    self.log('Switch vacation via method');
    this.switchMode('vacation',command);
};

Presence.prototype.switchNight = function(command) {
    self.log('Switch night via method');
    this.switchMode('night',command);
};

Presence.prototype.switchMode = function(type,newLevel) {
    var self = this;
    
    var deviceObject    = self[type+'Dev'];
    var oldLevel        = deviceObject.get('metrics:level');
    if (typeof(oldMode) !== 'undefined' 
        && oldMode === newLevel) {
        return;
    }
    
    self.log('Switching '+newLevel+' '+type);
    deviceObject.set('metrics:level',newLevel);
    deviceObject.set('metrics:icon',self.imagePath+'/'+type+'_'+newLevel+'.png');
    
    self.calcMode(type);
    self.controller.emit("presence.switch"+type,newLevel);
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
        self.log('Setting new mode to '+newMode+' (was '+oldMode+')');
        self.presenceDev.set('metrics:mode',newMode);
        self.vacationDev.set('metrics:mode',newMode);
        self.nightDev.set('metrics:mode',newMode);
        self.controller.emit("presence."+newMode,newMode);
        
        var oldPresence = (oldMode === 'home' || oldMode === 'night') ? true:false;
        var newPresence = (newMode === 'home' || newMode === 'night') ? true:false;
        if (oldPresence !== newPresence) {
            self.controller.emit("presence."+(newPresence ? 'comehome':'leave'));
        }
    }
    
    return newMode;
};
