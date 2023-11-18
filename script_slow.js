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
let agents = [];
let focused_agent = 0;
let radius;
let center;
let colors = ["#ff0074", "#b52b2b", "#159ca1", "#f0823e"]
let final_data = []
let frames = [];
let current_point = 0;
let current_agent = 0;
let agent_points = []
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
            console.log(intern);
            final_data = intern.data;
            colors = intern.frameColors;
            radius = intern.frameRadius;
            center = intern.frameCenter;
            filename = intern.name;
            agents = intern.agents;
            agent_nums = agents.length;
            console.log(agents);
            usingDishMask = radius ? true : false
            console.log(intern.agentPoints)
            agent_points = intern.agentPoints;
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
        
        if (!document.getElementById("numagents").value) {
            alert("Must choose a number of agents")
        } 
        framerate = document.getElementById("framenum").value; 
        for (let i = 0; i < agent_nums; i++) {
            let type = document.getElementById(`agent${i}`).value;
            agents.push({
                agent_id: i,
                agent_type: type,
                agent_name: `${i}_${type}`
            })
        }

        init();
    }
}
let agent_nums = 0;
document.getElementById("numagents").addEventListener("change", function() {
    agent_nums = document.getElementById("numagents").value
    let content_div = document.getElementById("agentinfo");
    content_div.innerHTML = ""

    for (let i = 0; i < document.getElementById("numagents").value; i++) {
        let temp_div = document.createElement("div");
        let agent_type = document.createElement("select")
        agent_type.id = `agent${i}`
        let grip_option = document.createElement("option")
        grip_option.value = "Gripper"
        grip_option.innerText = "Gripper"
        let needle_option = document.createElement("option")
        needle_option.value = "Needle"
        needle_option.innerText = "Needle"
        agent_type.appendChild(grip_option)
        agent_type.appendChild(needle_option)
        temp_div.appendChild(agent_type)
        content_div.appendChild(temp_div)
        content_div.append(document.createElement("br"))
    }
})

function init() {
    // document.body.style.zoom = "70%";
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

        if (!(agent_points.length)) {
            for (let i = 0; i < frames.length; i++) {
                let temp = []
                for (let j = 0; j < agent_nums * 2; j++) {
                    temp.push([0, 0])
                }
                agent_points.push(temp)
            }
            // doing array.fill fills the array with the rereference to something, not a copy of the value
            // agent_points = Array(frames.length).fill(Array(agent_nums * 2).fill([0, 0]))
        }
        
        document.getElementById("pointIndicator").innerText = `Choosing: ${agents[current_agent].agent_name}, point ${current_point}`
        
        if (final_data.length != frames.length) {

            for (let i = final_data.length; i < frames.length; i++) {
                let temp_obj = {}
                for (let j = 0; j < agents.length; j++) {
                    let name = agents[j].agent_name
                    if (agents[j].agent_type == "Gripper") {
                        temp_obj[name] = Array(11).fill([0, 0])
                    } else {
                        temp_obj[name] = Array(5).fill([0, 0])
                    }
                }
                final_data.push({
                    frame: i,
                    coords: temp_obj
                })
            }

        }

        let color_legend = document.getElementById("colorLegend");
        for (let i = 0; i < agents.length; i++) {
            for (let j = 0; j < 2; j++) {
                let temp_dot = document.createElement("span")
                temp_dot.className = "dot"
                temp_dot.style.backgroundColor = colors[2 * i + j]
                let temp_div = document.createElement("div")
                temp_div.appendChild(temp_dot)
                let temp_text = document.createElement("p")
                temp_text.textContent = `${agents[i].agent_name}, Point ${j}`
                temp_div.appendChild(temp_dot)
                temp_div.appendChild(temp_text);
                color_legend.appendChild(temp_div);
            }
        }

        put_image(0);
    })
}

// these are also fine
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
    computePoints();
    current_frame = parseInt(request_input.value) + 1
    current_agent = 0;
    current_point = 0;
    resetChoice();
    if (current_frame >= frames.length) {
        alert("No more frames left");
    } else {
        request_input.value = current_frame
        put_image(current_frame)
    }
}

function back_frame() {
    current_agent = 0;
    current_point = 0
    current_frame = parseInt(request_input.value) - 1
    resetChoice();
    if (current_frame < 0) {
        alert("No more frames left");
        current_frame = 0;
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
    requested_ctx.putImageData(frames[index], 0, 0);
    if (usingDishMask) {
        requested_ctx.fillStyle = "black"
        requested_ctx.beginPath();
        requested_ctx.arc(center[0], center[1], radius,0, 2 * Math.PI, true);
        requested_ctx.rect(0, 0, requested_frames.width, requested_frames.height);
        requested_ctx.fill();
    }
    
    for (let i = 0; i < agent_nums; i++) {
        let temp_data = final_data[index].coords[agents[i].agent_name]
        if (agents[i].agent_type === "Gripper") {
            requested_ctx.fillStyle = colors[i * 2]
            let coord_1_x = temp_data[0][0]
            let coord_1_y = temp_data[0][1]
            requested_ctx.fillRect(coord_1_x - 3, coord_1_y - 3, 6, 6);
    
            requested_ctx.fillStyle = colors[i * 2 + 1]
            let coord_2_x = temp_data[1][0]
            let coord_2_y = temp_data[1][1]
            requested_ctx.fillRect(coord_2_x - 3, coord_2_y - 3, 6, 6);
    
            for (let j = 2; j < temp_data.length; j++) {
                let coord_x = temp_data[j][0]
                let coord_y = temp_data[j][1]
                requested_ctx.fillStyle = "#e8e354"
                requested_ctx.fillRect(coord_x - 3, coord_y - 3, 6, 6);
            }
        } else {
            requested_ctx.fillStyle = colors[i * 2]
            let coord_1_x = temp_data[0][0]
            let coord_1_y = temp_data[0][1]
            requested_ctx.fillRect(coord_1_x - 3, coord_1_y - 3, 6, 6);

            for (let j = 1; j < temp_data.length - 1; j++) {
                let coord_x = temp_data[j][0]
                let coord_y = temp_data[j][1]
                requested_ctx.fillStyle = "#e8e354"
                requested_ctx.fillRect(coord_x - 3, coord_y - 3, 6, 6);

            }
    
            requested_ctx.fillStyle = colors[i * 2 + 1]
            let coord_2_x = temp_data[temp_data.length - 1][0]
            let coord_2_y = temp_data[temp_data.length - 1][1]
            requested_ctx.fillRect(coord_2_x - 3, coord_2_y - 3, 6, 6);
        }
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
})

function matrix_vec_mult(matrix, vec) {
    let resulting_vec = []
    for (let i = 0; i < matrix.length; i++) {
        let quantity = 0;
        for (let j = 0;  j < matrix.length; j++) {
            quantity += matrix[i][j] * vec[j]
        }
        resulting_vec.push(quantity)
    }
    return resulting_vec
}
function mm_to_px(length) {
    const px_to_mm_ratio = 424 / 19
    return length * px_to_mm_ratio
}
const l2 = mm_to_px(2.22), 
    l3 = l2 + mm_to_px(2),
    l4 = l2 + mm_to_px(3.96),
    l5 = mm_to_px(8),
    l6 = mm_to_px(0.858),
    l7 = mm_to_px(1.49),
    l8 = mm_to_px(2.29), 
    l9 = mm_to_px(5.23)

function computeInitialLengths(l1) {

    let pts = [
        [l1 / 2, -l2, 1],
        [l1 / 2, -l3, 1],
        [l1 / 2, -l4, 1],
        [l6, -l5, 1],
        [l1 - l6, -l5, 1], 
        [-l7, -l8, 1],
        [l1 + l7, -l8, 1],
        [-l7, -l9, 1],
        [l1 + l7, -l9, 1]
    ]
    return pts
}
function computeGripperPoints(point1, point2) {
    let point_list = [[...point1], [...point2]]
    point1[1] *= -1
    point2[1] *= -1
    let x_prime = point2[0] - point1[0]
    let y_prime = point2[1] - point1[1]
    let d_vec = [point1[0], point1[1]]
    let theta = Math.atan2(y_prime, x_prime)

    let transformation_matrix = [
        [Math.cos(theta), - Math.sin(theta), d_vec[0]],
        [Math.sin(theta), Math.cos(theta), d_vec[1]],
        [0, 0, 1]
    ]
    let l1 = Math.sqrt(Math.pow(x_prime, 2) + Math.pow(y_prime, 2))
    let gripper_coords = computeInitialLengths(l1)
    for (let i = 0; i < gripper_coords.length; i++) {
        let temp = matrix_vec_mult(transformation_matrix, gripper_coords[i])
        temp[1] = temp[1] < 0 ? temp[1] *= -1 : temp[1]
        point_list.push(temp);
    }
    point1[1] *= -1
    point2[1] *= -1

    return point_list
}

function computeNeedlePoints(point1, point2) {
    let point_list = [point1]
    let mid = [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2]
    point_list.push([(point1[0] + mid[0]) / 2, (point1[1] + mid[1]) / 2])
    point_list.push(mid)
    point_list.push([(point2[0] + mid[0]) / 2, (point2[1] + mid[1]) / 2])
    point_list.push(point2);
    
    return point_list
}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log(agent_points)
    agent_points[current_frame][2 * current_agent + current_point] = [...[x, y]]
    console.log(agent_points)
    console.log(`Frame: ${current_frame}
                Coordinate x: ${x}
                Coordinate y: ${y}`);

    if (current_point == 1) {
        current_agent = (current_agent + 1) % agents.length;
        current_point = 0
    } else {
        current_point += 1
    }
    
    requested_ctx.fillStyle = colors[2 * current_agent + current_point]
    fill_points(current_frame)
    document.getElementById("pointIndicator").innerText = `Choosing: ${agents[current_agent].agent_name}, point ${current_point}`

}

function fill_points(index) {
    requested_ctx.putImageData(frames[index], 0, 0);
    if (usingDishMask) {
        requested_ctx.fillStyle = "black"
        requested_ctx.beginPath();
        requested_ctx.arc(center[0], center[1], radius,0, 2 * Math.PI, true);
        requested_ctx.rect(0, 0, requested_frames.width, requested_frames.height);
        requested_ctx.fill();
    }

    let points = agent_points[index]
    for (let i = 0; i < points.length; i++) {
        requested_ctx.fillStyle = colors[i]
        let x = points[i][0]
        let y = points[i][1]
        requested_ctx.fillRect(x - 3, y - 3, 6, 6);
    }
}

function computePoints() {
    for (let i = 0; i < agent_nums; i++) {
        let point_1 = agent_points[current_frame][2 * i]
        let point_2 = agent_points[current_frame][2 * i + 1]
        if (agents[i].agent_type == "Gripper") {

            final_data[current_frame].coords[agents[i].agent_name] = computeGripperPoints(point_1, point_2);
        } else {
            final_data[current_frame].coords[agents[i].agent_name] = computeNeedlePoints(point_1, point_2);
            
        }
    }

    put_image(current_frame)
}

window.addEventListener('keydown', event => {
    if (event.code === "KeyR") {
        current_agent = (current_agent + 1) % agents.length
        document.getElementById("pointIndicator").innerText = `Choosing: ${agents[current_agent].agent_name}, point ${current_point}`
        console.log(`Choosing: ${agents[current_agent].agent_name}, point ${current_point}`) 
    } else if (event.code === "KeyE") {
        computePoints()
    } else if (event.code === "KeyQ") {
        current_point = (current_point + 1) % 2;
        document.getElementById("pointIndicator").innerText = `Choosing: ${agents[current_agent].agent_name}, point ${current_point}`

    } else if (event.code === "KeyW") {
        let prevPoints = [...agent_points[current_frame - 1]];
        for (let i = 0; i < prevPoints.length; i++) {
            agent_points[current_frame][i] = [...prevPoints[i]]
        }
        computePoints()
        put_image(current_frame)
    }
})

window.addEventListener('keydown', event => {
    if (event.code === "ArrowUp") {
        event.preventDefault();
        agent_points[current_frame][current_agent * 2][1] -= 1
        agent_points[current_frame][current_agent * 2 + 1][1] -= 1
        computePoints()
    } else if (event.code === "ArrowDown") {
        event.preventDefault()
        agent_points[current_frame][current_agent * 2][1] += 1
        agent_points[current_frame][current_agent * 2 + 1][1] += 1
        computePoints()
    } else if (event.code === "ArrowLeft") {
        event.preventDefault()
        agent_points[current_frame][current_agent * 2][0] -= 1
        agent_points[current_frame][current_agent * 2 + 1][0] -= 1
        computePoints()
    } else if (event.code === "ArrowRight") {
        event.preventDefault()
        agent_points[current_frame][current_agent * 2][0] += 1
        agent_points[current_frame][current_agent * 2 + 1][0] += 1
        computePoints()
    } else if (event.code === "KeyA") {
        event.preventDefault()
        rotate_agent(-0.01)
    } else if (event.code === "KeyD") {
        event.preventDefault()
        rotate_agent(0.01)
    }
})


function rotate_agent(theta) {
    let center = [0, 0]
    let new_points = []
    let cur_agent = agents[current_agent]
    let cur_points = final_data[current_frame].coords[cur_agent.agent_name]
    if (cur_agent.agent_type === "Gripper") {
        center = final_data[current_frame].coords[cur_agent.agent_name][3]
    } else if (cur_agent.agent_type === "Needle") {
        center = final_data[current_frame].coords[cur_agent.agent_name][2]
    }

    for (let i = 0; i < cur_points.length; i++) {
        let point_0 = cur_points[i]
        let new_x = (point_0[0] - center[0]) * Math.cos(theta) - (point_0[1] - center[1]) * Math.sin(theta) + center[0]
        let new_y = (point_0[0] - center[0]) * Math.sin(theta) + (point_0[1] - center[1]) * Math.cos(theta) + center[1]
        new_points.push([new_x, new_y])
    }

    final_data[current_frame].coords[cur_agent.agent_name] = new_points
    if (cur_agent.agent_type === "Gripper") {
        agent_points[current_frame][current_agent * 2] = new_points[0]
        agent_points[current_frame][current_agent * 2 + 1] = new_points[1]
    } else if (cur_agent.agent_type === "Needle") {
        agent_points[current_frame][current_agent * 2] = new_points[0]
        agent_points[current_frame][current_agent * 2 + 1] = new_points[new_points.length - 1]
    }
    put_image(current_frame)
}

// these are fine
function exportJson(link) {
    let final_obj = {
        name: filename,
        dimension: video_dim,
        frameCenter: center,
        frameRadius: radius, 
        frameRate: framerate,
        frameColors: colors,
        agents: agents,
        data: final_data,
        agentPoints: agent_points
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

function toggleZoom() {
    if (zoom.style.display == "block") {
        zoom.style.display = "none"
    } else {
        zoom.style.display = "block";
    }
}

function resetChoice() {
    focused_agent = 0;
    current_point = 0;
    current_agent = 0;
    document.getElementById("pointIndicator").innerText = `Choosing: ${agents[current_agent].agent_name}, point ${current_point}`;
}
