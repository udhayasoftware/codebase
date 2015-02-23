var request = require('request');
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var requestntlm = require('./ntlm.js');

var globalCookie = null;

function NTLMClient() {

}

NTLMClient.prototype.startRequest = function (config, postbody, callback) {
    var keepaliveAgent = new HttpsAgent();
    var options = {
        headers: {
            'Content-Type': 'text/xml;charset="utf-8"',
            "Accept": 'text/xml',
            "Expect": '100-continue',
            // "Connection": 'Keep-Alive',
            "Host": config.host
        },
        agent: keepaliveAgent,
        rejectUnauthorized: false,
        url: config.url,
        body: postbody
    };
    request.post(options, function (error, response, body) {
        if (error) {
            callback(error, null);
        } else {
            var setCookie = response.headers['set-cookie'];
            if (setCookie !== undefined) {
                setCookie = setCookie[0].split(";");
                setCookie = setCookie[0];
                globalCookie = setCookie;
            } else {
                setCookie = globalCookie;
            }
            NTLMClient.prototype.sendSecondRequest(config, setCookie,
                options, callback);
        }
    });
};

NTLMClient.prototype.sendSecondRequest = function (config, cookie, options, callback) {
    console.log("Second Input, Cookie = " + cookie);
    options.headers = {
        'Content-Type': 'text/xml;charset="utf-8"',
        "Accept": 'text/xml',
        "Authorization": requestntlm.createType1Message(config), //'Negotiate TlRMTVNTUAABAAAAl4II4gAAAAAAAAAAAAAAAAAAAAAGAbEdAAAADw==', //NTLMSSP
        "Cookie": cookie,
        "Content-Length": 0,
        "Host": config.host
    };
    request.post(options, function (error, response, body) {
        if (error) {
            callback(error, null);
        } else {
            var authenticate = response.headers['www-authenticate'];
            var type2msg = requestntlm.parseType2Message(response.headers['www-authenticate']);
            var type3msg = requestntlm.createType3Message(type2msg, config);
            NTLMClient.prototype.thirdRequest(cookie, type3msg,
                options, callback);
        }
    });

};

NTLMClient.prototype.thirdRequest = function (cookie, authorization, options, callback) {
    console.log("Third Input, Authorization = " + authorization);
    options.headers = {
        'Content-Type': 'text/xml;charset="utf-8"',
        "Accept": 'text/xml',
        "Authorization": authorization,
        "Cookie": cookie,
        "Content-Length": options.body.length,
        "Expect": '100-continue'
    };
    console.log(JSON.stringify(options.body))
    request.post(options, function (error, response, body) {
        // We need to get response here
        if (error) {
            callback(error, null);
        } else {
            callback(null, body);
        }
    });
};

module.exports = NTLMClient;
