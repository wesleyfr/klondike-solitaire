/**
 *
 * Message - An observer/listener pattern for Javascript.
 *    Usage:
 *    To bind a listener to a message on an object:
 *        Message( object ).bind( message_name, callback );
 *    To trigger all listeners bound on a message on an object:
 *        Message( object ).trigger( message_name, data );
 *    When calling a callback, it will be called in the contxt of the
 *        object being registered upon.  The input parameters will be:
 *        event, data1, data2, ..., dataN
 *    Example:
 *        var testObject = {};
 *        Message( testObject ).bind( 'testmessage', function( event, value1, value2 )
 *        {
 *            alert( 'event: ' + event.message + ' value1: ' + value1 + ' value2: ' + value2 );
 *        };
 *
 *        Message( testObject ).trigger( 'testmessage, [ 'testvalue1', 'testvalue2' ] );
 */
Message = function(object) {
    if (!object.__objectID) { // Gives the object an ID if it doesn't already have one.
        object.__objectID = (Message.currID++).toString();
    } // end if

    // return an object that contains the functions that can be worked with.
    return {
        bind: function(message, callback) {
            var handlers = Message.messages[message + object.__objectID] = Message.messages[message + object.__objectID] || [];
            handlers.push(callback);
            return this;
        },

        trigger: function(message, data) {
            var handlers = Message.messages[message + object.__objectID];
            if (handlers) {
                var event = {
                    target: object,
                    type: message
                };
                var callbackArgs = [event].concat(data || []);

                // go through all the handlers and call them with the arguments list we made up.
                for (var index = 0, handler; handler = handlers[index]; ++index) {
                    handler.apply(object, callbackArgs);
                } // end for
            } // end if
            return this;
        }
    };
};

/**
 * static variables used for the message processor.
 */
Message.messages = {};
Message.currID = 0;

module.exports = Message;