import { useAuth } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { api } from "@/api";
import { useAppContext } from "@/context/AppContext";
import Toast from "react-native-toast-message";
import RedditSansBold from "../../assets/fonts/RedditSans-Bold.ttf";
import RedditSansMedium from "../../assets/fonts/RedditSans-Medium.ttf";
import RedditSansRegular from "../../assets/fonts/RedditSans-Regular.ttf";
import RedditSansSemiBold from "../../assets/fonts/RedditSans-SemiBold.ttf";

const splashVideo = require("../../assets/splash/splash.mp4");

export default function Index() {
  const { user, loading } = useAuth();
  const { setRates } = useAppContext();

  const [videoFinished, setVideoFinished] = useState(false);

  const [fontsLoaded] = useFonts({
    "RedditSans-Regular": RedditSansRegular,
    "RedditSans-Medium": RedditSansMedium,
    "RedditSans-SemiBold": RedditSansSemiBold,
    "RedditSans-Bold": RedditSansBold,
  });

  const player = useVideoPlayer(splashVideo, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      setVideoFinished(true);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (loading || !fontsLoaded || !videoFinished) {
      return;
    }

    const initializeApp = async () => {
      if (user?.id) {
        try {
          const response = await api.get("/dashboard/rates", {
            validateStatus: () => true,
          });

          setRates(response.data.rates);

          router.replace("/home");
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Something went wrong!",
            text2: error.message,
          });
        }
      } else {
        router.replace("/auth");
      }
    };

    initializeApp();
  }, [loading, fontsLoaded, videoFinished, user?.id]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  video: {
    width: "100%",
    height: "100%",
  },
});
