import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import MapView, { Polygon } from "react-native-maps";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { supabase } from "../lib/supabase";

function bboxFromRegion(region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  const minLat = latitude - latitudeDelta / 2;
  const maxLat = latitude + latitudeDelta / 2;
  const minLng = longitude - longitudeDelta / 2;
  const maxLng = longitude + longitudeDelta / 2;
  return { minLat, maxLat, minLng, maxLng };
}

function geojsonToPolygons(geomGeojson) {
  // MultiPolygon: [ [ [ [lng,lat], ... ] ] , ... ]
  if (!geomGeojson) return [];
  const { type, coordinates } = geomGeojson;

  if (type === "Polygon") {
    return [coordinates[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))];
  }
  if (type === "MultiPolygon") {
    return coordinates.map((poly) =>
      poly[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
    );
  }
  return [];
}

export default function MapScreen() {
  const theme = useTheme();
  const mapRef = useRef(null);

  const [county, setCounty] = useState("effingham");
  const [profile, setProfile] = useState(null);

  const [region, setRegion] = useState({
    latitude: 39.2,
    longitude: -88.55,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  });

  const [loading, setLoading] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ownerName, setOwnerName] = useState(null);

  const adsVisible = useMemo(() => {
    if (!profile) return false;
    if (profile.role === "premium" || profile.role === "admin") return false;
    return !!profile.ads_enabled;
  }, [profile]);

  const ownerAllowed = useMemo(() => {
    if (!profile) return false;
    return profile.role === "premium" || profile.role === "admin" || profile.owner_access;
  }, [profile]);

  const loadProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role, ads_enabled, owner_access")
      .eq("user_id", uid)
      .single()
      .throwOnError();

    if (!error) setProfile(data);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fetchParcels = useCallback(
    async (rgn) => {
      setLoading(true);
      setSelected(null);
      setOwnerName(null);
      try {
        const { minLat, maxLat, minLng, maxLng } = bboxFromRegion(rgn);

        const { data, error } = await supabase.rpc("parcels_in_bbox", {
          p_county: county,
          p_min_lng: minLng,
          p_min_lat: minLat,
          p_max_lng: maxLng,
          p_max_lat: maxLat,
          p_limit: 1200,
        });

        if (error) throw error;
        setParcels(data ?? []);
      } catch (e) {
        // swallow for MVP; you can add a toast later
        setParcels([]);
      } finally {
        setLoading(false);
      }
    },
    [county]
  );

  useEffect(() => {
    fetchParcels(region);
  }, [county]); // eslint-disable-line

  const onRegionChangeComplete = useCallback(
    (rgn) => {
      setRegion(rgn);
      // light debounce by only fetching on "complete"
      fetchParcels(rgn);
    },
    [fetchParcels]
  );

  const handleTap = useCallback(
    async (event) => {
      const { coordinate } = event.nativeEvent;
      setSelected(null);
      setOwnerName(null);

      try {
        const { data, error } = await supabase.rpc("parcel_at_point", {
          p_county: county,
          p_lng: coordinate.longitude,
          p_lat: coordinate.latitude,
        });
        if (error) throw error;

        const hit = (data && data[0]) || null;
        setSelected(hit);

        if (hit && ownerAllowed) {
          const { data: ownerData, error: ownerErr } = await supabase.rpc(
            "get_owner_name",
            { p_parcel_id: hit.id }
          );
          if (!ownerErr && ownerData && ownerData[0]) {
            setOwnerName(ownerData[0].owner_name || null);
          }
        }
      } catch (e) {
        // ignore for MVP
      }
    },
    [county, ownerAllowed]
  );

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={handleTap}
        showsUserLocation
        showsMyLocationButton
      >
        {parcels.map((p) => {
          const polys = geojsonToPolygons(p.geom_geojson);
          return polys.map((coords, idx) => (
            <Polygon
              key={`${p.id}-${idx}`}
              coordinates={coords}
              strokeWidth={1}
              strokeColor={theme.colors.tertiary}
              fillColor={"rgba(54,124,43,0.06)"}
            />
          ));
        })}
      </MapView>

      {/* Top HUD */}
      <View style={{ position: "absolute", top: 14, left: 12, right: 12, gap: 10 }}>
        <Card style={{ borderRadius: 22, padding: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text variant="titleMedium" style={{ flex: 1 }}>
              Back40
            </Text>
            <IconButton icon="logout" onPress={signOut} />
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            <Chip
              selected={county === "effingham"}
              onPress={() => setCounty("effingham")}
              style={{ borderRadius: 999 }}
            >
              Effingham
            </Chip>
            <Chip
              selected={county === "fayette"}
              onPress={() => setCounty("fayette")}
              style={{ borderRadius: 999 }}
            >
              Fayette
            </Chip>

            <View style={{ flex: 1 }} />
            <Chip style={{ borderRadius: 999 }}>
              {loading ? "Loading…" : `${parcels.length} parcels`}
            </Chip>
          </View>
        </Card>

        {adsVisible && (
          <Card style={{ borderRadius: 18, padding: 12 }}>
            <Text style={{ opacity: 0.85 }}>
              Ad slot (AdMob goes here). Upgrade to Premium to remove ads + unlock owner names.
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              onPress={() => {
                // Later: navigate to paywall
              }}
            >
              Go Premium
            </Button>
          </Card>
        )}
      </View>

      {/* Bottom info sheet (simple MVP card) */}
      {selected && (
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 14 }}>
          <Card style={{ borderRadius: 22, padding: 14 }}>
            <Text variant="titleLarge">
              Parcel {selected.parcel_id ? selected.parcel_id : `#${selected.id}`}
            </Text>
            <Text style={{ opacity: 0.85, marginTop: 4 }}>
              County: {selected.county}
              {selected.acreage ? ` • ${Number(selected.acreage).toFixed(2)} acres` : ""}
            </Text>

            <View style={{ marginTop: 10 }}>
              {ownerAllowed ? (
                <>
                  <Text style={{ opacity: 0.8 }}>Owner</Text>
                  <Text variant="titleMedium">
                    {ownerName ? ownerName : "Loading owner…"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ opacity: 0.8 }}>Owner</Text>
                  <Text variant="titleMedium">Premium feature</Text>
                  <Button mode="contained" style={{ marginTop: 10 }}>
                    Upgrade to Premium
                  </Button>
                </>
              )}
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}
