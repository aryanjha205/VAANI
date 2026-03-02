import os
import subprocess
import imageio_ffmpeg as ffmpeg

def apply_voice_filter(file_path, filter_type):
    if filter_type == 'none' or not filter_type:
        return file_path

    ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
    output_filename = f"filtered_{os.path.basename(file_path)}"
    # Force .wav extension for simplicity and compatibility
    if not output_filename.endswith('.wav'):
        output_filename = os.path.splitext(output_filename)[0] + '.wav'
        
    output_path = os.path.join(os.path.dirname(file_path), output_filename)

    # Define filters using ffmpeg audio filters (-af)
    filters = ""
    
    if filter_type == 'girl':
        # Pitch up (1.5x) and keep rhythm with atempo (1/1.5)
        filters = "asetrate=44100*1.5,atempo=1/1.5,aresample=44100"
    
    elif filter_type == 'female':
        # Slight pitch up
        filters = "asetrate=44100*1.2,atempo=1/1.2,aresample=44100"

    elif filter_type == 'cartoon':
        # Chipmunk
        filters = "asetrate=44100*1.8,atempo=1/1.8,aresample=44100"

    elif filter_type == 'robot':
        # Metallic effect using flanger and lowpass
        filters = "aecho=0.8:0.88:6:0.4,firequalizer=gain='if(gt(f,400),0,-20)',flanger=delay=20:depth=0.2:regen=50:width=100:speed=0.1"

    elif filter_type == 'echo':
        # DJ Echo
        filters = "aecho=0.8:0.9:1000:0.3"

    elif filter_type == 'celebrity':
        # Deep voice: pitch down
        filters = "asetrate=44100*0.85,atempo=1/0.85,aresample=44100,equalizer=f=100:width_type=h:w=200:g=5"

    if not filters:
        return file_path

    try:
        # Run ffmpeg command with 15s timeout
        cmd = [
            ffmpeg_exe, "-y", "-i", file_path,
            "-af", filters,
            output_path
        ]
        
        # Use subprocess.run for blocking execution with timeout
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            return output_path
        else:
            print(f"FFMPEG ERROR: {result.stderr}")
            return file_path

    except Exception as e:
        print(f"VOICE CHANGER EXCEPTION: {e}")
        return file_path
