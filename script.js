let video;
let requested_frames = document.getElementById("specificframe");
let requested_ctx = requested_frames.getContext("2d");
let request_input = document.getElementById("requestframe");
let moveon = document.getElementById("moveon");
let back = document.getElementById("back");
let next = document.getElementById("next");
let current_frame = 0;
let imageContainer = document.getElementById("specificframe")
let zoom = document.getElementById("zoom")
let zoomctx = zoom.getContext("2d")
let radius;
let center;
let colors = []
let final_data = []
let frames = [];
let current_point = 0;
let framerate = 1;
let usingDishMask = false
let filename;
let video_dim;

function getRandomColor() {
    let h = Math.floor(Math.random() * 360);
    let s = Math.floor(Math.random() * 80) + 20;
    let l = Math.floor(Math.random() * 70) + 10;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function returningsubmit() {
    let file_json = document.getElementById("json").files;
    video = document.getElementById("video");
    let input = document.getElementById("file");

    if (file_json.length != 0) {
        
        let fileRead = new FileReader();
        fileRead.onload = function(e) {
            let content = e.target.result;
            let intern = JSON.parse(content);
            final_data = intern.data;
            colors = intern.frameColors;
            radius = intern.frameRadius;
            center = intern.frameCenter;
            filename = intern.name;
            usingDishMask = radius ? true : false
        }

        document.getElementById("video").src = URL.createObjectURL(input.files[0]);
        fileRead.readAsText(file_json[0])
        document.getElementById("collection").style.display = "block";
        document.getElementById("upload").style.display = "none"
        framerate = document.getElementById("framenum").value; 

        init();
    } else {
        alert("Must choose a file for previous data dump")
    }
}

function newsubmit() {
    document.getElementById("upload").style.display = "none"
    
    video = document.getElementById("video");
    let input = document.getElementById("file");
    if (input.files.length == 0) {
        alert("Must upload a file")
    } else {
        document.getElementById("collection").style.display = "block";
        document.getElementById("video").src = URL.createObjectURL(input.files[0]);
        filename = input.value.split("\\").pop()
        radius = document.getElementById("maskradius").value;
        center = [document.getElementById("maskcenterx").value, document.getElementById("maskcentery").value]
        usingDishMask = radius ? true : false
        
        if (!document.getElementById("numframes").value) {
            alert("Must choose a number of points")
        } else {
            let numframes = document.getElementById("numframes").value
            for (let i = 0; i < numframes; i++) {
                colors.push(getRandomColor())
            }
        }
        framerate = document.getElementById("framenum").value; 

        init();
    }
}

function init() {
    
    video = document.getElementById("video");
    VideoToFrames.getFrames(video.src, framerate, VideoToFramesMethod.fps).then(function(frames_data) {
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
        video_dim = [frames[0].width, frames[0].height]
        
        if (final_data.length != frames.length) {

            for (let i = final_data.length; i < frames.length; i++) {
                let temp_arr = []
                for (let i = 0; i < colors.length; i++) {
                    temp_arr.push([0, 0])
                }
                final_data.push({
                    frame: i,
                    coords: temp_arr
                })
            }
        }

        let color_legend = document.getElementById("colorLegend");
        for (let i = 0; i < colors.length; i++) {
            let temp_dot = document.createElement("span")
            temp_dot.className = "dot"
            temp_dot.style.backgroundColor = colors[i]
            let temp_div = document.createElement("div")
            temp_div.appendChild(temp_dot)
            let temp_text = document.createElement("p")
            temp_text.textContent = `Point ${i}`
            temp_div.appendChild(temp_dot)
            temp_div.appendChild(temp_text);
            color_legend.appendChild(temp_div);
        }

        put_image(0);
    })
}

request_input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        current_frame = parseInt(request_input.value)
        put_image(current_frame);
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
        event.preventDefault();
        next_frame()
    } else if (event.code === "KeyB") {
        back_frame()
    } else if (event.code === "KeyZ") {
        let prevPoints = final_data[current_frame - 1].coords;
        for (i = 0; i < prevPoints.length; i++) {
            final_data[current_frame].coords[i] = [...prevPoints[i]]
        }
        put_image(current_frame)
    }
})

function put_image(index) {
    let points = document.getElementsByClassName("point")
    while (points[0]) {
        points[0].parentNode.removeChild(points[0])
    }
    requested_ctx.putImageData(frames[index], 0, 0);
    if (usingDishMask) {
        requested_ctx.fillStyle = "black"
        requested_ctx.beginPath();
        requested_ctx.arc(center[0], center[1], radius,0, 2 * Math.PI, true);
        requested_ctx.rect(0, 0, requested_frames.width, requested_frames.height);
        requested_ctx.fill();
    }

    for (let i = 0; i < colors.length; i++) {
        requested_ctx.fillStyle = colors[i]
        requested_ctx.fillRect(final_data[index].coords[i][0] - 3, final_data[index].coords[i][1] - 3, 6, 6);
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
    final_data[current_frame].coords[current_point] = [x, y];
    document.getElementById("pointIndicator").innerText = `Choosing: ${(current_point + 1) % colors.length}`
    console.log(`Frame: ${current_frame}
                Coordinate x: ${x}
                Coordinate y: ${y}`);
    requested_ctx.fillStyle = colors[current_point]
    requested_ctx.fillRect(x, y, 4, 4);
    put_image(current_frame);
    current_point = (current_point + 1) % colors.length;
}

window.addEventListener('keydown', event => {
    if (event.code === "ArrowRight") {
        current_point = (current_point + 1) % colors.length;
        document.getElementById("pointIndicator").innerText = `Choosing: ${current_point}`
    } else if (event.code === "ArrowLeft") {
        if (current_point > 0) {
            current_point = (current_point - 1) % colors.length;
        } else {
            current_point = colors.length - 1;
        }
        document.getElementById("pointIndicator").innerText = `Choosing: ${current_point}`
    } else if (event.code === "KeyD") {
        move_right();
    } else if (event.code === "KeyA") {
        move_left();
    } else if (event.code === "KeyS") {
        move_up();
    } else if (event.code === "KeyW") {
        move_down();
    }
})

function remove_point(element) {
    let num = parseInt(element.textContent.split(" ")[1])
    final_data[current_frame].coords.splice(num, 1);
    put_image(current_frame);
}

function exportJson(link) {
    let final_obj = {
        name: filename,
        dimension: video_dim,
        frameCenter: center,
        frameRadius: radius, 
        frameRate: framerate,
        frameColors: colors,
        data: final_data,
    }
    let data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(final_obj));
    link.setAttribute("href", "data:" + data);
    link.setAttribute("download", "data.json");
}

function switchInputType() {
    let newStyle = document.getElementById("new")
    let returningStyle = document.getElementById("returning")

    if (newStyle.style.display == "block") {
        newStyle.style.display = "none";
        returningStyle.style.display = "block"
        document.getElementById("headerlabel").text = "Upload existing data"
    } else if (newStyle.style.display == "none") {
        newStyle.style.display = "block";
        returningStyle.style.display = "none"
        document.getElementById("headerlabel").text = "Upload new video"
    }
}

function selectDishMask() {
    let dishDetails = document.getElementById("dishmask")
    if (dishDetails.style.display == "none") {
        dishDetails.style.display = "block"
    } else if (dishDetails.style.display == "block") {
        dishDetails.style.display = "none"
    }
}

function move_up() {
    for (let i = 0; i < final_data[current_frame].coords.length; i++) {
        final_data[current_frame].coords[i][1] += 1;
    }
    put_image(current_frame)
}

function move_down() {
    for (let i = 0; i < final_data[current_frame].coords.length; i++) {
        final_data[current_frame].coords[i][1] -= 1;
    }
    put_image(current_frame)
}

function move_right() {
    for (let i = 0; i < final_data[current_frame].coords.length; i++) {
        final_data[current_frame].coords[i][0] += 1;
    }
    put_image(current_frame)
}

function move_left() {
    for (let i = 0; i < final_data[current_frame].coords.length; i++) {
        final_data[current_frame].coords[i][0] -= 1;
    }
    put_image(current_frame)
}