var startTime = performance.now();
var endTime;
VideoToFrames.getFrames('test1.mp4', 30, VideoToFramesMethod.totalFrames).then(function (frames) {
    let counter = 0;
    endTime = performance.now();
    frames.forEach(function (frame) {
        var canvas = document.createElement('canvas');
        canvas.width = frame.width;
        canvas.height = frame.height;
        canvas.getContext('2d').putImageData(frame, 0, 0);
        document.getElementsByTagName('body')[0].appendChild(canvas);
        counter += 1;
    });
    console.log(endTime - startTime);
    console.log(counter);
});