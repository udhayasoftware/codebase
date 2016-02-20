
var NTLMClient = require("./NTLMClient");

var config = {
    username: 'username',
    password: 'password',
    domain: 'banana',
    workstation: '',
    url: 'https://mail.company.com/ews/exchange.asmx',
    host: 'mail.company.com'
};

var postbody = '<?xml version="1.0" encoding="utf-8"?>    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">    <soap:Body>        <FindItem xmlns="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types" Traversal="Shallow">            <ItemShape>                <t:BaseShape>Default</t:BaseShape>            </ItemShape>            <IndexedPageItemView MaxEntriesReturned="50" Offset="0" BasePoint="Beginning" />            <ParentFolderIds>                <t:DistinguishedFolderId Id="inbox" />            </ParentFolderIds>        </FindItem>    </soap:Body>    </soap:Envelope>';

var ntlmClient = new NTLMClient();
ntlmClient.startRequest(config, postbody, function (err, body) {
    if (err) {
        console.log(err);
    } else {      
    	console.log("Response = "+body);
    }
});