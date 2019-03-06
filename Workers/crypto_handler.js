var config = require("config");
var aesjs = require('aes-js');

var key_256 = config.Host.encryptedhex;

var key = Buffer.from(key_256);

function encrypt(text) {
    try {
        var textBytes = aesjs.utils.utf8.toBytes(text);

// The counter is optional, and if omitted will begin at 1
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var encryptedBytes = aesCtr.encrypt(textBytes);

// To print or store the binary data, you may convert it to hex
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        return encryptedHex;
    } catch (ex) {
        console.error(ex);
        return text;
    }
}

function decrypt(encryptedHex) {
    try {
        var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);

// The counter mode of operation maintains internal state, so to
// decrypt a new instance must be instantiated.
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var decryptedBytes = aesCtr.decrypt(encryptedBytes);

// Convert our bytes back into text
        var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
        return decryptedText;
    }
    catch (ex) {
        console.error(ex);
        return encryptedHex;
    }
}

module.exports.Encrypt = encrypt;
module.exports.Decrypt = decrypt;