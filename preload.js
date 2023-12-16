const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  takeScreenshot: () => ipcRenderer.send('get-screenshot-source'),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});

ipcRenderer.on('screenshot-source', async (event, sourceId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 4000,
          minHeight: 720,
          maxHeight: 4000
        }
      }
    });
    handleStream(stream);
  } catch (e) {
    console.error(e);
  }
});

ipcRenderer.on('screenshot-saved', (event, sspath) => {
  console.log(`Screenshot saved to ${sspath}`);
  const screenshotPath = document.getElementById('screenshotPath');
  screenshotPath.innerHTML = sspath;
});

function handleStream(stream) {
  console.log("Handling stream");
  const video = document.createElement('video');
  console.log("Video created");
  video.srcObject = stream;
  console.log("Video source set");
  video.onloadedmetadata = (e) => video.play();
  console.log("Video playing");

  console.log("Adding event listener");
  video.addEventListener('play', () => {
    console.log("Video playing");
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    console.log("Screenshot taken");
    canvas.toBlob(blob => {
      console.log("Blob created");
      saveScreenshot(blob);
    }, 'image/png');
  });
}

function saveScreenshot(blob) {
  console.log("Saving screenshot");
  const reader = new FileReader();
  reader.onloadend = () => {
    const buffer = Buffer.from(reader.result);
    // Send the image data to the renderer process
    const data = buffer.toString('base64');
    const dataUri = `data:image/png;base64,${data}`;
    const screenshotImage = document.getElementById('screenshotImage');
    screenshotImage.style.display = 'block';
    screenshotImage.src = dataUri;
    ipcRenderer.send('save-screenshot', dataUri);
  };
  reader.readAsArrayBuffer(blob);
}


