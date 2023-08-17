mkdir $1
ffmpeg -i $1.mp4 -map 0 -f segment -segment_time 60 -reset_timestamps 1 -c copy $1/output_%03d.mp4