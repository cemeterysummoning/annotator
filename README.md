# MagnetoSuture Annotator
This annotator was built for the specific purpose of annotating videos for the MiniMagnetoSuture project under Dr. Yancy Diaz-Mercado and Suraj Raval in the UMD Department of Mechanical Engineering. 

Videos must be in .mp4 format under an h.264 encoding. `ffmpeg` can be used to achieve this conversion.
```
 ffmpeg -i input.avi -vcodec libx264 output.mp4
 ```

The frame separator script is credited to this [github repository](https://github.com/bertyhell/video-to-frames).

If there are too many requested frames, the application may crash. I've provided the `split.sh` shell file, which splits each video into 10-second pieces, which may reduce the load.