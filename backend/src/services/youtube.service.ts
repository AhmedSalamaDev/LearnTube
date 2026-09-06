import { google } from "googleapis";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

const youtube = google.youtube({
  version: "v3",
  auth: YOUTUBE_API_KEY,
});

export interface VideoMetadata {
  videoId: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

export interface PlaylistMetadata {
  playlistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videos: VideoMetadata[];
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

export function extractYouTubeId(url: string): {
  type: "video" | "playlist";
  id: string;
} | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const playlistId = urlObj.searchParams.get("list");
      if (playlistId) {
        return { type: "playlist", id: playlistId };
      }

      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return { type: "video", id: videoId };
      }
    }

    if (hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return { type: "video", id: videoId };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const response = await youtube.videos.list({
    part: ["snippet", "contentDetails"],
    id: [videoId],
  });

  const video = response.data.items?.[0];
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const snippet = video.snippet;
  const contentDetails = video.contentDetails;

  return {
    videoId,
    title: snippet?.title || "Untitled Video",
    durationSeconds: parseISO8601Duration(contentDetails?.duration || "PT0S"),
    thumbnailUrl:
      snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || "",
  };
}

export async function fetchPlaylistMetadata(
  playlistId: string
): Promise<PlaylistMetadata> {
  const playlistResponse = await youtube.playlists.list({
    part: ["snippet"],
    id: [playlistId],
  });

  const playlist = playlistResponse.data.items?.[0];
  if (!playlist) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }

  const snippet = playlist.snippet;

  let videoIds: string[] = [];
  let nextPageToken: string | undefined | null;

  do {
    const itemsResponse = await youtube.playlistItems.list({
      part: ["contentDetails"],
      playlistId,
      maxResults: 50,
      ...(nextPageToken && { pageToken: nextPageToken }),
    });

    const ids =
      itemsResponse.data.items
        ?.map((item: any) => item.contentDetails?.videoId)
        .filter((id: any): id is string => !!id) || [];

    videoIds.push(...ids);
    nextPageToken = itemsResponse.data.nextPageToken;
  } while (nextPageToken);

  const videos: VideoMetadata[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosResponse = await youtube.videos.list({
      part: ["snippet", "contentDetails"],
      id: batch,
    });

    const batchVideos =
      videosResponse.data.items?.map((video, index) => ({
        videoId: video.id || "",
        title: video.snippet?.title || "Untitled Video",
        durationSeconds: parseISO8601Duration(
          video.contentDetails?.duration || "PT0S"
        ),
        thumbnailUrl:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
      })) || [];

    videos.push(...batchVideos);
  }

  return {
    playlistId,
    title: snippet?.title || "Untitled Playlist",
    description: snippet?.description || "",
    thumbnailUrl:
      snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || "",
    videos,
  };
}
