import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput, Card } from "react-native-paper";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("signin"); // signin | signup
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Check your email to confirm your account (if required).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text variant="headlineLarge" style={{ marginBottom: 6 }}>
        Back40
      </Text>
      <Text style={{ opacity: 0.8, marginBottom: 16 }}>
        Property lines made simple.
      </Text>

      <Card style={{ padding: 16, borderRadius: 20 }}>
        <TextInput
          label="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={{ marginBottom: 12 }}
        />

        {!!msg && (
          <Text style={{ marginBottom: 12, opacity: 0.9 }}>{msg}</Text>
        )}

        <Button mode="contained" loading={busy} onPress={submit}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <Button
          mode="text"
          onPress={() => setMode(mode === "signup" ? "signin" : "signup")}
          style={{ marginTop: 8 }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </Button>
      </Card>
    </View>
  );
}
