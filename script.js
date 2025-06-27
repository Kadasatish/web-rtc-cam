const dot = document.getElementById("dot");
const dotToggle = document.getElementById("dotToggle");
const camSwitch = document.getElementById("camSwitch");
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");

let myPeer = new Peer();
let conn = null;
let call = null;
let stream = null;

myPeer.on("open", id => {
  const peerId = prompt("Enter peer ID to connect or leave blank to wait:");
  if (peerId) {
    conn = myPeer.connect(peerId);
    conn.on("open", () => {
      console.log("Data connection established!");
      setupDataHandlers(conn);
    });

    // Call with audio/video
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
      stream = s;
      myVideo.srcObject = stream;
      call = myPeer.call(peerId, stream);
      call.on("stream", remoteStream => {
        remoteVideo.srcObject = remoteStream;
      });
    });
  }
});

// Incoming connection
myPeer.on("connection", incomingConn => {
  conn = incomingConn;
  conn.on("open", () => {
    console.log("Incoming data connection!");
    setupDataHandlers(conn);
  });
});

myPeer.on("call", incomingCall => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
    stream = s;
    myVideo.srcObject = stream;
    incomingCall.answer(stream);
    incomingCall.on("stream", remoteStream => {
      remoteVideo.srcObject = remoteStream;
    });
  });
});

// Sync dot toggle
dotToggle.addEventListener("change", () => {
  const isOn = dotToggle.checked;
  dot.style.backgroundColor = isOn ? "white" : "black";
  if (conn) conn.send({ type: "dot", state: isOn });
});

// Cam mode switching
camSwitch.addEventListener("input", () => {
  let mode = parseInt(camSwitch.value);
  if (mode === 0) switchCam("environment");
  else if (mode === 2) switchCam("user");
  else stopCam();
});

function setupDataHandlers(conn) {
  conn.on("data", data => {
    if (data.type === "dot") {
      dot.style.backgroundColor = data.state ? "white" : "black";
      dotToggle.checked = data.state;
    }
  });
}

function switchCam(facing) {
  if (stream) stopCam();
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { exact: facing } },
    audio: true
  }).then(s => {
    stream = s;
    myVideo.srcObject = stream;
    if (call) call.close();
    call = myPeer.call(conn.peer, stream);
    call.on("stream", remoteStream => {
      remoteVideo.srcObject = remoteStream;
    });
  });
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  myVideo.srcObject = null;
    }
