import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import { api } from "../../lib/api";

interface VideoPlayerProps {
  videoId: string; // Database video ID
  youtubeVideoId: string; // YouTube video ID
  onVideoEnd?: () => void;
}

export const VideoPlayer = ({
  videoId,
  youtubeVideoId,
  onVideoEnd,
}: VideoPlayerProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const activityIntervalRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await api.get(`/activity/progress/${videoId}`);
        const { progress } = response.data;

        if (progress && progress.checkpointSeconds > 0 && playerRef.current) {
          // Resume from saved checkpoint position
          playerRef.current.seekTo(progress.checkpointSeconds, true);
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };

    if (isReady) {
      loadProgress();
    }
  }, [videoId, isReady]);

  // Start activity tracking (every 15 seconds)
  const startActivityTracking = () => {
    if (activityIntervalRef.current) return; // Already tracking

    activityIntervalRef.current = setInterval(async () => {
      try {
        if (playerRef.current) {
          const state = await playerRef.current.getPlayerState();
          // Only log if video is playing (state === 1)
          if (state === 1) {
            await api.post("/activity/log", {
              videoId,
              watchedSecondsChunk: 15,
            });
          }
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    }, 15000); // Every 15 seconds
  };

  // Stop activity tracking
  const stopActivityTracking = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
  };

  // Save progress to backend
  const saveProgress = async (isCompleted = false) => {
    try {
      if (playerRef.current) {
        const currentTime = await playerRef.current.getCurrentTime();
        await api.patch(`/activity/progress/${videoId}`, {
          checkpointSeconds: Math.floor(currentTime),
          isCompleted,
        });
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // YouTube player event handlers
  const onReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
    setIsReady(true);
  };

  const onPlay: YouTubeProps["onPlay"] = () => {
    startActivityTracking();
  };

  const onPause: YouTubeProps["onPause"] = () => {
    stopActivityTracking();
    saveProgress(false);
  };

  const onEnd: YouTubeProps["onEnd"] = () => {
    stopActivityTracking();
    saveProgress(true);
    onVideoEnd?.();
  };

  const onStateChange: YouTubeProps["onStateChange"] = (event) => {
    // Handle seek events (state change without play/pause)
    if (event.data === 2) {
      // Paused
      saveProgress(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActivityTracking();
      saveProgress(false);
    };
  }, []);

  // Handle page visibility (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playerRef.current) {
        playerRef.current.pauseVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
    host: "https://www.youtube-nocookie.com", // Use privacy-enhanced mode to reduce cookie issues
  };

  return (
    <div className="relative w-full aspect-video bg-black">
      <YouTube
        videoId={youtubeVideoId}
        opts={opts}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnd={onEnd}
        onStateChange={onStateChange}
        className="absolute inset-0"
        iframeClassName="w-full h-full"
        title="YouTube video player"
      />
    </div>
  );
};
