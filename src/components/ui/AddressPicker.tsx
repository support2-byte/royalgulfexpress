import { tr } from "@/i18n";
import { api } from "@/api";
import { TextField } from "@/components/ui/Form";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Prediction = { placeId: string; description: string };
type Coords = { latitude: number; longitude: number };

const DEFAULT_COORDS: Coords = { latitude: 25.2048, longitude: 55.2708 };

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AddressPicker = ({
  value,
  onChangeText,
  placeholder,
  disabled,
}: Props) => {
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const mapRef = useRef<MapView>(null);
  const skipSearch = useRef(false);
  const requestId = useRef(0);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [resolving, setResolving] = useState(false);
  const [marker, setMarker] = useState<Coords | null>(null);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const input = value.trim();
    if (input.length < 3) {
      setPredictions([]);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/maps/autocomplete", { params: { input } });
        if (id === requestId.current) {
          setPredictions(res.data?.predictions ?? []);
        }
      } catch {
        if (id === requestId.current) setPredictions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  const moveTo = (coords: Coords) => {
    setMarker(coords);
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400,
    );
  };

  const applyAddress = (address: string) => {
    if (address !== value) skipSearch.current = true;
    setPredictions([]);
    onChangeText(address);
  };

  const handleSelectPrediction = async (p: Prediction) => {
    setResolving(true);
    try {
      const res = await api.get("/maps/geocode", {
        params: { placeId: p.placeId },
      });
      const a = res.data?.address;
      if (a) {
        applyAddress(a.formattedAddress);
        moveTo({ latitude: a.lat, longitude: a.lng });
      }
    } catch {
      applyAddress(p.description);
    } finally {
      setResolving(false);
    }
  };

  const handlePickPoint = async (coords: Coords) => {
    if (disabled) return;
    moveTo(coords);
    setResolving(true);
    try {
      const res = await api.get("/maps/reverse-geocode", {
        params: { lat: coords.latitude, lng: coords.longitude },
      });
      const a = res.data?.address;
      if (a) applyAddress(a.formattedAddress);
    } catch {
    } finally {
      setResolving(false);
    }
  };

  return (
    <View>
      <TextField
        icon="location-outline"
        placeholder={placeholder ?? "Search or pick delivery address"}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
      />

      {predictions.length > 0 && (
        <View style={styles.suggestions}>
          {predictions.map((p, i) => (
            <TouchableOpacity
              key={p.placeId}
              style={[styles.suggestion, i > 0 && styles.suggestionBorder]}
              activeOpacity={0.7}
              onPress={() => handleSelectPrediction(p)}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {p.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...DEFAULT_COORDS,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }}
          onPress={(e) => handlePickPoint(e.nativeEvent.coordinate)}
        >
          {marker && (
            <Marker
              coordinate={marker}
              draggable={!disabled}
              onDragEnd={(e) => handlePickPoint(e.nativeEvent.coordinate)}
            />
          )}
        </MapView>
        {resolving && (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>
      <Text style={styles.hint}>
        {tr("Tap the map or drag the pin to set the address")}
      </Text>
    </View>
  );
};

export default AddressPicker;

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    suggestions: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      marginBottom: 8,
      overflow: "hidden",
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    suggestionBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    suggestionText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    mapWrap: {
      height: 200,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    mapLoader: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.4)",
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      paddingHorizontal: 6,
      marginBottom: 8,
    },
  });
