let video, temp, ctx_temp;
let quit_reception = false
let framecount;
let requested_frames = document.getElementById("specificframe");
let requested_ctx = requested_frames.getContext("2d");
let request_input = document.getElementById("requestframe");
let moveon = document.getElementById("moveon");
let annotation_info = []
let back = document.getElementById("back");
let next = document.getElementById("next");
let current_frame = 0;
let imageContainer = document.getElementById("specificframe")
let zoom = document.getElementById("zoom")
let zoomctx = zoom.getContext("2d")
let radius;
let center;
let point_container = document.getElementById("pointcontainer")

let final_data = []
let frames = [];

function submit() {
    document.getElementById("upload").style.display = "none"
    
    video = document.getElementById("video");
    let input = document.getElementById("file");
    if (input.files.length == 0) {
        alert("Must upload a file")
    } else {
        document.getElementById("collection").style.display = "block";
        document.getElementById("video").src = URL.createObjectURL(input.files[0]);
        radius = document.getElementById("maskradius").value;
        center = [document.getElementById("maskcenterx").value, document.getElementById("maskcentery").value]

        let file_json = document.getElementById("json").files;

        if (file_json.length != 0) {
            
            let fileRead = new FileReader();
            fileRead.onload = function(e) {
                let content = e.target.result;
                let intern = JSON.parse(content);
                final_data = intern.data;

            }
            fileRead.readAsText(file_json[0])
        } 

        init();
    }
}

function init() {
    
    video = document.getElementById("video");

    VideoToFrames.getFrames(video.src, 30, VideoToFramesMethod.fps).then(function(frames_data) {
        frames_data.forEach(function (frame) {
            frames.push(frame);
        });
        console.log(frames);
        let label = document.getElementById("header")
        label.textContent = "Frames gathered, total frames: " + frames.length;
        moveon.style.display = "block";
        request_input.min = 0;
        request_input.max = frames.length;
        request_input.value = current_frame;
        requested_frames.width = frames[0].width
        requested_frames.height = frames[0].height
        
        
        if (final_data.length != frames.length) {

            for (let i = final_data.length; i < frames.length; i++) {
                            final_data.push({
                                frame: i,
                                coords: []
                            })
                        }
        }
        put_image(0);
    })
}

request_input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        current_frame = parseInt(request_input.value)
        requested_ctx.putImageData(frames[current_frame], 0, 0)
    }
})

moveon.addEventListener("click", function() {
    document.getElementById("annotate").style.display = "block"
    document.getElementById("collection").style.display = "none"
})

function next_frame() {
    current_frame = parseInt(request_input.value) + 1
    if (current_frame >= frames.length) {
        alert("No more frames left");
    } else {
        request_input.value = current_frame
        put_image(current_frame)
        
    }
}
function back_frame() {
    current_frame = parseInt(request_input.value) - 1
    if (current_frame < 0) {
        alert("No more frames left");
    } else {
        request_input.value = current_frame
        put_image(current_frame)
    }
}
back.addEventListener("click", function() {
    back_frame();
})

next.addEventListener("click", function() {
    next_frame()
})

document.addEventListener('keydown', (event) => {
    if (event.code === "Space") {
        next_frame()
    } else if (event.code === "KeyB") {
        back_frame()
    }
})

function put_image(index) {
    let points = document.getElementsByClassName("point")
    while (points[0]) {
        points[0].parentNode.removeChild(points[0])
    }
    requested_ctx.putImageData(frames[index], 0, 0);
    requested_ctx.fillStyle = "black"
    requested_ctx.beginPath();
    requested_ctx.arc(center[0], center[1], radius,0, 2 * Math.PI, true);
    requested_ctx.rect(0, 0, requested_frames.width, requested_frames.height);
    requested_ctx.fill();


    requested_ctx.fillStyle = "#ff0074"
    for (let i = 0; i < final_data[index].coords.length; i++) {
        point_container.innerHTML += `
            <div class="point" onclick="remove_point(this)">❌ ${i}. (${final_data[index].coords[i][0]}, ${final_data[index].coords[i][1]})</div>
        `
        requested_ctx.fillRect(final_data[index].coords[i][0], final_data[index].coords[i][1], 3, 3);
    }

}

requested_frames.addEventListener("click", function(event) {
    getMousePosition(requested_frames, event);
})

requested_frames.addEventListener("mousemove", function(e) {
    zoomctx.fillStyle = "white"
    zoomctx.fillRect(0, 0, zoom.width, zoom.height);
    zoomctx.drawImage(requested_frames, 
        e.x - requested_frames.getBoundingClientRect().x - 100, 
        e.y - requested_frames.getBoundingClientRect().y - 50, 200, 100, 0,0, 400, 200);
    
    zoom.style.top = e.pageY + 20 + "px"
    zoom.style.left = e.pageX + 20 + "px"

    zoomctx.moveTo(200, 100 - 10);
    zoomctx.lineTo(200, 100 + 10);
    
    zoomctx.moveTo(200 - 10, 100);
    zoomctx.lineTo(200 + 10, 100);
    zoomctx.strokeStyle = '#DB14C1';
    zoomctx.stroke()
    zoom.style.display = "block"
})

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log(`Frame: ${current_frame}
                Coordinate x: ${x}
                Coordinate y: ${y}`);
    final_data[current_frame].coords.push([x, y]);

    point_container.innerHTML += `
            <div class="point" onclick="remove_point(this)">❌ ${final_data[current_frame].coords.length - 1}. (${x}, ${y})</div>
        `
    requested_ctx.fillStyle = "#ff0074"
    requested_ctx.fillRect(x, y, 3, 3);
}

function remove_point(element) {
    let num = parseInt(element.textContent.split(" ")[1])
    final_data[current_frame].coords.splice(num, 1);
    put_image(current_frame);
}

function exportJson(link) {
    let final_obj = {
        frameCenter: center,
        frameRadius: radius, 
        data: final_data
    }
    let data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(final_obj));
    link.setAttribute("href", "data:" + data);
    link.setAttribute("download", "data.json");
}