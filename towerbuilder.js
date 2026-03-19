javascript:(function(){
    if(window.log && log.log){
        var old = log.log;
        log.log = function(d){
            if(d.event === "finishGameTowerBuilder"){
                d.score = 1767; 
                d.remainingTries = 2;
                d.isDebug = false;
                console.log("Tower Builder Hacked: 45 Floors");
            }
            return old.apply(this, arguments);
        };
        alert("Tower Builder Active!");
    }
})();
