console.log("hello")

// this global object keeps track of the 1-1 pairing of peer connections and
// data channels. Each peer should have a peer connection and data channel
// mapPeers object will be like
// {<peerusername1>: [<peerconnectionforpeer1>, <dcforpeer1>],
//  <peerusername2>: [<peerconnectionforpeer2>, <dcforpeer2>], }
var mapPeers = {};

var inputUsername = document.getElementById('input-username');
var btnJoinRoom = document.getElementById('btn-join-room');

var username;
var webSocket;

function webSocketOnMessage(event) {
  var parseData = JSON.parse(event.data);
  var peerUsername = parseData['peer'];
  var action = parseData['action'];

  // every time consumer sends a group signal, the peer who originally sent
  // signal to consumer will receive the signal from consumer too.
  // So here we check and ignore the signal that was originally triggered by
  // myself.
  if (peerUsername == username) {
    return;
  }

  var receiver_channel_name = parseData['message']['receiver_channel_name'];

  if (action == 'new-peer') {
    createOfferer(peerUsername, receiver_channel_name);

    return;
  }

  if (action == 'new-offer') {
    var offer = parseData['message']['sdp'];

    createAnswerer(offer, peerUsername, receiver_channel_name);
  }

  if (action == 'new-answer') {
    var answer = parseData['message']['sdp'];

    var peer = mapPeers[peerUsername][0];

    peer.setRemoteDescription(answer);

    return;
  }

}

btnJoinRoom.addEventListener('click', () => {
  username = inputUsername.value;
  btnSendMsg.style.visibility = 'visible';
  messageInput.style.visibility = 'visible';

  // we don't trigger join room if username box is empty
  if (username == '') {
    return;
  }

  // once click join room, we clear the username input box and disable it
  // and make the box disappear
  inputUsername.value = '';
  inputUsername.disabled = true;
  inputUsername.style.visibility = 'hidden';

  // once user clicks join room, we also disable and make disappear the Join
  // room button
  btnJoinRoom.disabled = true;
  btnJoinRoom.style.visibility = 'hidden';

  var labelUsername = document.getElementById('label-username')
  labelUsername.innerHTML = username;

  var loc = window.location;
  var wsStart = 'ws://';

  // production site has https protocol, so we can use http protocol to see if
  // our websocket prefix should be ws or wss
  if (loc.protocol == 'https:') {
    wsStart = 'wss://';
  }

  var endPoint = wsStart + loc.host + ":8001/";

  webSocket = new WebSocket(endPoint)

  webSocket.addEventListener('open', (e) => {
    console.log('Connection opened!');

    // when a new peer opens a new connection, send a signal to consumer so
    // consumer can signal other peers about this new peer
    sendSignal('new-peer', {});
  })
  // webSocketOnMessage handles whenever webSocket receives a message
  // consumer
  webSocket.addEventListener('message', webSocketOnMessage);
  webSocket.addEventListener('close', (e) => {
    console.log('Connection closed!');
  })
  webSocket.addEventListener('error', (e) => {
    console.log('Error!');
  })
});

var btnSendMsg = document.getElementById('btn-send-msg');
var messageList = document.getElementById('message-list');
var messageInput = document.getElementById('msg');
if (inputUsername.disabled == false && inputUsername.value == '') {
  btnSendMsg.style.visibility = 'hidden';
  messageInput.style.visibility = 'hidden';
}

btnSendMsg.addEventListener('click', sendMsgOnClick);

function sendMsgOnClick() {
  var message = messageInput.value;

  var newMsgElem = document.createElement('li');
  newMsgElem.appendChild(document.createTextNode('Me: ' + message));
  messageList.appendChild(newMsgElem);

  var dataChannels = getDataChannels();

  message = username + ': ' + message;

  for (index in dataChannels) {
    dataChannels[index].send(message);
  }
  messageInput.value = '';
}

var localStream = new MediaStream();

const constraints = {
  'video': true,
  'audio': true
};

const localVideo = document.getElementById('local-video');

const btnToggleAudio = document.getElementById('btn-toggle-audio');

const btnToggleVideo = document.getElementById('btn-toggle-video');

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    // getUserMedia get us this stream object and we set localStream to stream
    localStream = stream;
    localVideo.srcObject = localStream;
    // we mute the localvideo so we don't hear ourselves from the local video
    localVideo.muted = true;

    var audioTracks = stream.getAudioTracks();
    var videoTracks = stream.getVideoTracks();

    audioTracks[0].enabled = true;
    videoTracks[0].enabled = true;

    btnToggleAudio.addEventListener('click', () => {
      audioTracks[0].enabled = !audioTracks[0].enabled;
      if (audioTracks[0].enabled) {
        btnToggleAudio.innerHTML = 'Mute audio';
        return;
      }
      btnToggleAudio.innerHTML = 'Unmute audio';
    });

    btnToggleVideo.addEventListener('click', () => {
      videoTracks[0].enabled = !videoTracks[0].enabled;
      if (videoTracks[0].enabled) {
        btnToggleVideo.innerHTML = 'Video off';
        return;
      }
      btnToggleVideo.innerHTML = 'Video on';

    });
  })
  .catch(error => {
    console.log('Error accessing media device', error);
  })

function sendSignal(action, message) {
  var jsonStr = JSON.stringify({
    'peer': username,
    'action': action,
    'message': message,
  });
  webSocket.send(jsonStr);
}

function createOfferer(peerUsername, receiver_channel_name) {
  // we put null here for now. In this case, we can only create peer connection
  // for multiple devices all under the same network
  // To accomplish multi device under different networks, we need to set up
  // turn server which we will research later. We then pass in a dict that
  // specifies turn server.
  var peer = new RTCPeerConnection(null);


  // take local audio and video tracks and add into the peer dict
  // which will be sent to other peers to be streamed
  addLocalTracks(peer);

  // we use websocket to send and receive signals. To actually send the message,
  // and video/audio tracks, we use data channels instead of websocket. So
  // we create data channel here.
  var dc = peer.createDataChannel('channel');
  dc.addEventListener('open', () => {
    console.log('connection opened!')
  })
  dc.addEventListener('message', dcOnMessage);

  // create a new video to display the video from the new peer
  var remoteVideo = createVideo(peerUsername);

  // add eventlistener to the peer connection
  setOnTrack(peer, remoteVideo);

  mapPeers[peerUsername] = [peer, dc];

  // handle cases when a peer leaves the room or connection somehow drops.
  // We delete the peer-dc-mapping from the mapPeers dict.
  // If the peer connection isn't closed, but how somehow still disconnected or
  // failed, we manually close the peer connection. Then we remove the remote
  // video of that peer who became disconnected.
  peer.addEventListener('iceconnectionstatechange', () => {
    var iceConnectionState = peer.iceConnectionState;
    if (iceConnectionState == 'failed' || iceConnectionState == 'disconnected' || iceConnectionState == 'closed') {
      delete mapPeers[peerUsername];

      if (iceConnectionState != 'closed') {
        peer.close();
      }

      removeVideo(remoteVideo);
    }
  });

  // whenever the peer connection wants to create an offer or answer, it starts
  // gathering ice candidates, we want to ensure we only send out sdp to remote
  // peers after we finish gathering all ice candidates.
  peer.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      // when there is a new ice candidate, the localdescrip for the peer
      // connection will change
      console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
      return;
    }
    // when gathering ice candidates is completed, event.candidate will be null,
    // we reach the code below. We send out sdp to remote peer.

    sendSignal('new-offer', {
      'sdp': peer.localDescription,
      // we specify channel name because we don't send offer to all other peers.
      // we only send this offer to the one peer that initially sent the
      // 'new-peer' signal
      'receiver_channel_name': receiver_channel_name,
    });
  });
  peer.createOffer()
    .then(o => peer.setLocalDescription(o))
    .then(() => {
      console.log("local description set successfully.");
    })
}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
  // we put null here for now. In this case, we can only create peer connection
  // for multiple devices all under the same network
  // To accomplish multi device under different networks, we need to set up
  // turn server which we will research later. We then pass in a dict that
  // specifies turn server.
  var peer = new RTCPeerConnection(null);

  // take local audio and video tracks and add into the peer dict
  // which will be sent to other peers to be streamed
  addLocalTracks(peer);

  // create a new video to display the video from the remote peer who sent
  // the offer
  var remoteVideo = createVideo(peerUsername);

  // add eventlistener to the peer connection
  setOnTrack(peer, remoteVideo);

  peer.addEventListener('datachannel', e => {
    // get the dc created by the offerer
    peer.dc = e.channel;
    // we put evenlistener on the dc created by the offerer.
    peer.dc.addEventListener('open', () => {
      console.log('connection opened!')
    })
    peer.dc.addEventListener('message', dcOnMessage);
    // For the peer received an offer, connect this peer with the dc
    // passed within the offer in the mapPeers dict.
    mapPeers[peerUsername] = [peer, peer.dc];
  })



  // handle cases when the remote peer leaves the room or connection somehow drops.
  // We delete the peer-dc-mapping from the mapPeers dict.
  // If the peer connection isn't closed, but how somehow still disconnected or
  // failed, we manually close the peer connection. Then we remove the remote
  // video of that peer who became disconnected.
  peer.addEventListener('iceConnectionStatechange', () => {
    var iceConnectionState = peer.iceConnectionState;
    if (iceConnectionState == 'failed' || iceConnectionState == 'disconnected' || iceConnectionState == 'closed') {
      delete mapPeers[peerUsername];

      if (iceConnectionState != 'closed') {
        peer.close();
      }

      removeVideo(remoteVideo);
    }
  });

  // whenever the peer connection wants to create an offer or answer, it starts
  // gathering ice candidates, we want to ensure we only send out sdp to remote
  // peers after we finish gathering all ice candidates.
  peer.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      // when there is a new ice candidate, the localdescrip for the peer
      // connection will change
      console.log('New ice candidate: ', JSON.stringify(peer.localDescription));
      return;
    }
    // when gathering ice candidates is completed, event.candidate will be null,
    // we reach the code below. We send out sdp to remote peer.

    sendSignal('new-answer', {
      'sdp': peer.localDescription,
      // we specify channel name because we don't send offer to all other peers.
      // we only send this offer to the one peer that sent theh offer
      'receiver_channel_name': receiver_channel_name,
    });
  });
  peer.setRemoteDescription(offer)
    .then(() => {
      console.log('remote description set successfully!');

      return peer.createAnswer();
    })
    .then(answer => {
      console.log('Answer created!')

      peer.setLocalDescription(answer);
    })

}

function addLocalTracks(peer) {
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  })
}

var messageList = document.getElementById('message-list');
function dcOnMessage(event) {
  var message = event.data;

  var li = document.createElement('li');
  li.appendChild(document.createTextNode(message));
  messageList.appendChild(li);
}

function createVideo(peerUsername) {
  var videoContainer = document.getElementById('video-container');

  var remoteVideo = document.createElement('video');
  remoteVideo.id = peerUsername + '-video';
  remoteVideo.autoplay = true;
  remoteVideo.playsInline = true;

  // add remote video from the new peer to the video container
  var videoWrapper = document.createElement('div');
  videoContainer.appendChild(videoWrapper);
  videoWrapper.appendChild(remoteVideo);

  var userNameWrapper = document.createElement('div');
  userNameWrapper.innerHTML = peerUsername;

  videoWrapper.appendChild(userNameWrapper);

  return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
  var remoteStream = new MediaStream();

  remoteVideo.srcObject = remoteStream;

  // whenever the peer connection gets a video/audio track from remote peer,
  // add the track to the remote stream. The remote stream will be the src for
  // remoteVideo element and gets played.
  peer.addEventListener('track', async (event) => {
    console.log("received track")
    remoteStream.addTrack(event.track, remoteStream);
  });
}

function removeVideo(video) {
  var videoWrapper = video.parentNode;

  videoWrapper.parentNode.removeChild(videoWrapper);
}

function getDataChannels() {
  var dataChannels = [];
  for (peerUsername in mapPeers) {
    var dataChannel = mapPeers[peerUsername][1];
    dataChannels.push(dataChannel);
  }
  return dataChannels;
}
