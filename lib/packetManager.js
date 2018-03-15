/*  
	*	packetManager.js
	*
	*	wrapper object to keep socket reference w/ data 
*/
class packetManager {
	constructor(_socket){
		this.socket = _socket;
		this._data = {};
	}
	// if content : setter, if not : getter
	data(content) {
		if (!content){
			return this._data;
		}
		this._data = content;
	}
}

module.exports = packetManager;