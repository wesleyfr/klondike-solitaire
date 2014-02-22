var nativeBind = Function.prototype.bind;

var Utils = function() {}

Utils.random = function(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
}

Utils.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    var value;
    for (var i = obj.length - 1; i >= 0; i--) {
        value = obj[i]
        rand = Utils.random(index++);
        shuffled[index - 1] = shuffled[rand];
        shuffled[rand] = value;
    };
    return shuffled;
}

Utils.bind = function(func, context) {
    var args, bound;
    var slice = Array.prototype.slice;

    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!(typeof func === 'function')) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
    };

}

Utils.addEventListener = function(el, eventName, handler) {
    if (el.addEventListener)
        el.addEventListener(eventName, handler)
    else
        el.attachEvent('on' + eventName, handler)
}

Utils.removeEventListener = function(el, eventName, handler) {
    if (el.removeEventListener)
        el.removeEventListener(eventName, handler)
    else
        el.detachEvent('on' + eventName, handler)
}

Utils.preloadimages = function(arr) {
    var newimages = [],
        loadedimages = 0
    var postaction = function() {}
    var arr = (typeof arr != "object") ? [arr] : arr

        function imageloadpost() {
            loadedimages++
            if (loadedimages == arr.length) {
                postaction(newimages) //call postaction and pass in newimages array as parameter
            }
        }
    for (var i = 0; i < arr.length; i++) {
        newimages[i] = new Image()
        newimages[i].src = arr[i]
        newimages[i].onload = function() {
            imageloadpost()
        }
        newimages[i].onerror = function() {
            imageloadpost()
        }
    }
    return { //return blank object with done() method
        done: function(f) {
            postaction = f || postaction //remember user defined callback functions to be called when images load
        }
    }
}

Utils.addClass = function(el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
}

Utils.removeClass = function(el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}


module.exports = Utils;