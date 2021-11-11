"use strict";
var FudgeNet;
(function (FudgeNet) {
    let COMMAND;
    (function (COMMAND) {
        COMMAND["UNDEFINED"] = "undefined";
        COMMAND["ERROR"] = "error";
        /** sent from server to assign an id for the connection and reconfirmed by the client. idTarget is used to carry the id  */
        COMMAND["ASSIGN_ID"] = "assignId";
        COMMAND["LOGIN_REQUEST"] = "loginRequest";
        COMMAND["LOGIN_RESPONSE"] = "loginResponse";
        COMMAND["SERVER_HEARTBEAT"] = "serverHeartbeat";
        COMMAND["CLIENT_HEARTBEAT"] = "clientHeartbeat";
        COMMAND["RTC_OFFER"] = "rtcOffer";
        COMMAND["RTC_ANSWER"] = "rtcAnswer";
        COMMAND["ICE_CANDIDATE"] = "rtcCandidate";
        COMMAND["DISCONNECT_CLIENT"] = "disconnect_client";
        COMMAND["CREATE_MESH"] = "createMesh";
        COMMAND["CONNECT_HOST"] = "connectHost";
        COMMAND["CONNECT_PEERS"] = "connectPeers";
    })(COMMAND = FudgeNet.COMMAND || (FudgeNet.COMMAND = {}));
    /**
     * Defines the route the message should take.
     * - route undefined -> send message to peer idTarget using RTC
     * - route undefined & idTarget undefined -> send message to all peers using RTC
     * - route HOST -> send message to peer acting as host using RTC, ignoring idTarget
     * - route SERVER -> send message to server using websocket
     * - route VIA_SERVER -> send message to client idTarget via server using websocket
     * - route VIA_SERVER_HOST -> send message to client acting as host via server using websocket, ignoring idTarget
     */
    let ROUTE;
    (function (ROUTE) {
        ROUTE["HOST"] = "toHost";
        ROUTE["SERVER"] = "toServer";
        ROUTE["VIA_SERVER"] = "viaServer";
        ROUTE["VIA_SERVER_HOST"] = "viaServerToHost";
    })(ROUTE = FudgeNet.ROUTE || (FudgeNet.ROUTE = {}));
})(FudgeNet || (FudgeNet = {}));
///<reference path="../Message.ts"/>
///<reference path="../../../Core/Build/FudgeCore.d.ts"/>
var FudgeNet;
///<reference path="../Message.ts"/>
///<reference path="../../../Core/Build/FudgeCore.d.ts"/>
(function (FudgeNet) {
    var ƒ = FudgeCore;
    class FudgeClient extends EventTarget {
        id;
        name;
        urlServer = undefined;
        socket;
        peers = {};
        constructor() {
            super();
            this.name = "";
            this.id = "undefined";
        }
        connectToServer = (_uri = "ws://localhost:8080") => {
            this.urlServer = _uri;
            this.socket = new WebSocket(_uri);
            this.addWebSocketEventListeners();
        };
        loginToServer = (_name) => {
            try {
                let message = {
                    command: FudgeNet.COMMAND.LOGIN_REQUEST, route: FudgeNet.ROUTE.SERVER, content: { name: _name }
                };
                this.dispatch(message);
            }
            catch (error) {
                ƒ.Debug.fudge("Unexpected error: Sending Login Request", error);
            }
        };
        connectToPeer = (_idRemote) => {
            if (this.peers[_idRemote])
                ƒ.Debug.warn("Peers already connected, ignoring request", this.id, _idRemote);
            else
                this.beginPeerConnectionNegotiation(_idRemote);
        };
        dispatch(_message) {
            _message.timeSender = Date.now();
            _message.idSource = this.id;
            let message = JSON.stringify(_message);
            try {
                if (!_message.route || _message.route == FudgeNet.ROUTE.HOST) {
                    // send via RTC to specific peer (if idTarget set), all peers (if not set) or host (if route set to host)
                    if (_message.idTarget)
                        this.sendToPeer(_message.idTarget, message);
                    else
                        this.sendToAllPeers(message);
                }
                else {
                    this.socket.send(message);
                }
            }
            catch (_error) {
                console.log(_error);
            }
        }
        // ----------------------
        sendToPeer = (_idPeer, _message) => {
            let dataChannel = this.peers[_idPeer].dataChannel;
            if (dataChannel && dataChannel.readyState == "open")
                dataChannel.send(_message);
            else {
                console.error("Datachannel: Connection unexpectedly lost");
            }
        };
        sendToAllPeers = (_message) => {
            for (let idPeer in this.peers) {
                this.sendToPeer(idPeer, _message);
            }
        };
        addWebSocketEventListeners = () => {
            try {
                this.socket.addEventListener(FudgeNet.EVENT.CONNECTION_OPENED, (_connOpen) => {
                    ƒ.Debug.fudge("Connected to the signaling server", _connOpen);
                });
                // this.wsServer.addEventListener(EVENT.ERROR, (_err: Event) => {
                // });
                this.socket.addEventListener(FudgeNet.EVENT.MESSAGE_RECEIVED, (_receivedMessage) => {
                    this.hndMessage(_receivedMessage);
                });
            }
            catch (error) {
                ƒ.Debug.fudge("Unexpected Error: Adding websocket Eventlistener", error);
            }
        };
        hndMessage = (_event) => {
            let message = JSON.parse(_event.data);
            //tslint:disable-next-line: no-any
            switch (message.command) {
                case FudgeNet.COMMAND.ASSIGN_ID:
                    ƒ.Debug.fudge("ID received", (message.idTarget));
                    this.assignIdAndSendConfirmation(message.idTarget);
                    break;
                case FudgeNet.COMMAND.LOGIN_RESPONSE:
                    this.loginValidAddUser(message.idSource, message.content?.success, message.content?.name);
                    break;
                case FudgeNet.COMMAND.RTC_OFFER:
                    this.receiveNegotiationOfferAndSetRemoteDescription(message);
                    break;
                case FudgeNet.COMMAND.RTC_ANSWER:
                    this.receiveAnswerAndSetRemoteDescription(message);
                    break;
                case FudgeNet.COMMAND.ICE_CANDIDATE:
                    this.addReceivedCandidateToPeerConnection(message);
                    break;
            }
            if (message.command != FudgeNet.COMMAND.SERVER_HEARTBEAT)
                console.log(_event.timeStamp, message);
            this.dispatchEvent(new MessageEvent(_event.type, _event));
        };
        beginPeerConnectionNegotiation = (_idRemote) => {
            try {
                this.peers[_idRemote] = new FudgeNet.RtcConnection();
                this.peers[_idRemote].createDataChannel(this, _idRemote);
            }
            catch (error) {
                console.error("Unexpected Error: Creating Client Datachannel and adding Listeners", error);
            }
            let peerConnection = this.peers[_idRemote].peerConnection;
            peerConnection.addEventListener("icecandidate", (_event) => this.sendIceCandidatesToPeer(_event.candidate, _idRemote));
            peerConnection.createOffer()
                .then(async (offer) => {
                ƒ.Debug.fudge("Local: createOffer, expected 'stable', got:  ", peerConnection.signalingState);
                return offer;
            })
                .then(async (offer) => {
                await peerConnection.setLocalDescription(offer);
                ƒ.Debug.fudge("Local: setDescription, expected 'have-local-offer', got:  ", peerConnection.signalingState);
            })
                .then(() => {
                this.createNegotiationOfferAndSendToPeer(_idRemote);
            })
                .catch((error) => {
                console.error("Unexpected Error: Creating RTCOffer", error);
            });
        };
        createNegotiationOfferAndSendToPeer = (_idRemote) => {
            try {
                let peerConnection = this.peers[_idRemote].peerConnection;
                const offerMessage = {
                    route: FudgeNet.ROUTE.SERVER, command: FudgeNet.COMMAND.RTC_OFFER, idTarget: _idRemote, content: { offer: peerConnection.localDescription }
                };
                // this.sendToServer(offerMessage);
                this.dispatch(offerMessage);
                ƒ.Debug.fudge("Local: send offer, expected 'have-local-offer', got:  ", peerConnection.signalingState);
            }
            catch (error) {
                console.error("Unexpected Error: Creating Object and Sending RTC Offer", error);
            }
        };
        receiveNegotiationOfferAndSetRemoteDescription = (_message) => {
            ƒ.Debug.fudge("Remote: offer received, create connection", _message);
            if (!_message.idSource)
                throw (new Error("message lacks source."));
            let peer = this.peers[_message.idSource] || (this.peers[_message.idSource] = new FudgeNet.RtcConnection());
            let peerConnection = peer.peerConnection;
            peerConnection.addEventListener("datachannel", (_event) => this.receiveDataChannelAndEstablishConnection(_event, peer));
            let offerToSet = _message.content?.offer;
            if (!offerToSet) {
                return;
            }
            peerConnection.setRemoteDescription(new RTCSessionDescription(offerToSet))
                .then(async () => {
                ƒ.Debug.fudge("Remote: set remote descripton, expected 'have-remote-offer', got:  ", peerConnection.signalingState);
                if (!_message.idSource)
                    throw (new Error("message lacks source"));
                this.answerNegotiationOffer(_message.idSource);
            })
                .catch((error) => {
                console.error("Unexpected Error: Setting Remote Description and Creating Answer", error);
            });
            ƒ.Debug.fudge("Remote: remote description set, expected 'stable', got:  ", peerConnection.signalingState);
        };
        answerNegotiationOffer = (_idRemote) => {
            let ultimateAnswer;
            let peerConnection = this.peers[_idRemote]?.peerConnection;
            // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
            peerConnection.createAnswer()
                .then(async (answer) => {
                ƒ.Debug.fudge("Remote: create answer, expected 'have-remote-offer', got:  ", peerConnection.signalingState);
                ultimateAnswer = new RTCSessionDescription(answer);
                return await peerConnection.setLocalDescription(ultimateAnswer);
            }).then(async () => {
                ƒ.Debug.fudge("Remote: create answer function, expected 'stable', got:  ", peerConnection.signalingState);
                const answerMessage = {
                    route: FudgeNet.ROUTE.SERVER, command: FudgeNet.COMMAND.RTC_ANSWER, idTarget: _idRemote, content: { answer: ultimateAnswer }
                };
                ƒ.Debug.fudge("Remote: send answer to server ", answerMessage);
                this.dispatch(answerMessage);
            })
                .catch((error) => {
                console.error("Unexpected error: Creating RTC Answer failed", error);
            });
        };
        receiveAnswerAndSetRemoteDescription = (_message) => {
            try {
                ƒ.Debug.fudge("Local: received answer, create data channel ", _message);
                if (!_message.idSource || !_message.content)
                    throw (new Error("message lacks source or content."));
                let descriptionAnswer = new RTCSessionDescription(_message.content.answer);
                this.peers[_message.idSource].peerConnection.setRemoteDescription(descriptionAnswer);
                this.peers[_message.idSource].createDataChannel(this, _message.idSource);
            }
            catch (error) {
                console.error("Unexpected Error: Setting Remote Description from Answer", error);
            }
        };
        sendIceCandidatesToPeer = (_candidate, _idRemote) => {
            if (!_candidate)
                return;
            try {
                ƒ.Debug.fudge("Local: send ICECandidates to server");
                let message = {
                    route: FudgeNet.ROUTE.SERVER, command: FudgeNet.COMMAND.ICE_CANDIDATE, idTarget: _idRemote, content: { candidate: _candidate }
                };
                this.dispatch(message);
            }
            catch (error) {
                console.error("Unexpected Error: Creating and Sending ICECandidates to Peer", error);
            }
        };
        addReceivedCandidateToPeerConnection = async (_message) => {
            ƒ.Debug.fudge("Remote: try to add candidate to peer connection");
            try {
                if (!_message.idSource || !_message.content)
                    throw (new Error("message lacks source or content."));
                await this.peers[_message.idSource].peerConnection.addIceCandidate(_message.content.candidate);
            }
            catch (error) {
                console.error("Unexpected Error: Adding Ice Candidate", error);
            }
        };
        receiveDataChannelAndEstablishConnection = (_event, _peer) => {
            ƒ.Debug.fudge("Remote: establish channel on connection", _event.channel);
            if (_event.channel) {
                _peer.addDataChannel(this, _event.channel);
            }
            else {
                console.error("Unexpected Error: RemoteDatachannel");
            }
        };
        loginValidAddUser = (_assignedId, _success, _name) => {
            if (_success) {
                this.name = _name;
                ƒ.Debug.fudge("Logged in to server as: " + this.name, this.id);
            }
            else {
                ƒ.Debug.fudge("Login failed, username taken", this.name, this.id);
            }
        };
        assignIdAndSendConfirmation = (_id) => {
            try {
                if (!_id)
                    throw (new Error("id undefined"));
                this.id = _id;
                // this.sendToServer(new Messages.IdAssigned(_id));
                let message = { command: FudgeNet.COMMAND.ASSIGN_ID, route: FudgeNet.ROUTE.SERVER };
                this.dispatch(message);
            }
            catch (error) {
                ƒ.Debug.fudge("Unexpected Error: Sending ID Confirmation", error);
            }
        };
    }
    FudgeNet.FudgeClient = FudgeClient;
})(FudgeNet || (FudgeNet = {}));
var FudgeNet;
(function (FudgeNet) {
    let EVENT;
    (function (EVENT) {
        EVENT["CONNECTION_OPENED"] = "open";
        EVENT["CONNECTION_CLOSED"] = "close";
        EVENT["ERROR"] = "error";
        EVENT["MESSAGE_RECEIVED"] = "message";
    })(EVENT = FudgeNet.EVENT || (FudgeNet.EVENT = {}));
    // More info from here https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
    // tslint:disable-next-line: typedef
    FudgeNet.configuration = {
        iceServers: [
            { urls: "stun:stun2.1.google.com:19302" },
            { urls: "stun:stun.example.com" }
        ]
    };
    class RtcConnection {
        peerConnection;
        dataChannel;
        // TODO: use mediaStream in the future? 
        mediaStream;
        constructor() {
            this.peerConnection = new RTCPeerConnection(FudgeNet.configuration);
        }
        createDataChannel(_client, _idRemote) {
            this.addDataChannel(_client, this.peerConnection.createDataChannel(_client.id + "->" + _idRemote));
        }
        addDataChannel(_client, _dataChannel) {
            this.dataChannel = _dataChannel;
            this.dataChannel.addEventListener(EVENT.CONNECTION_OPENED, dispatchRtcEvent);
            this.dataChannel.addEventListener(EVENT.CONNECTION_CLOSED, dispatchRtcEvent);
            this.dataChannel.addEventListener(EVENT.MESSAGE_RECEIVED, dispatchMessage);
            function dispatchRtcEvent(_event) {
                _client.dispatchEvent(new CustomEvent(EVENT.MESSAGE_RECEIVED, { detail: _event }));
            }
            function dispatchMessage(_event) {
                _client.dispatchEvent(new MessageEvent(_event.type, _event));
            }
        }
    }
    FudgeNet.RtcConnection = RtcConnection;
})(FudgeNet || (FudgeNet = {}));
//# sourceMappingURL=FudgeClient.js.map