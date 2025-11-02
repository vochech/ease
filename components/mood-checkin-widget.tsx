"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const MOOD_EMOJIS = [
  { emoji: "😊", label: "Skvělé", value: 9 },
  { emoji: "🙂", label: "Dobré", value: 7 },
  { emoji: "😐", label: "Neutrální", value: 5 },
  { emoji: "😟", label: "Špatné", value: 3 },
  { emoji: "😢", label: "Velmi špatné", value: 1 },
];

const STRESS_LABELS = [
  { range: [1, 2], label: "Žádný stres", color: "text-green-600" },
  { range: [3, 4], label: "Mírný stres", color: "text-blue-600" },
  { range: [5, 6], label: "Středně stresovaný", color: "text-yellow-600" },
  { range: [7, 8], label: "Hodně stresovaný", color: "text-orange-600" },
  { range: [9, 10], label: "Extrémní stres", color: "text-red-600" },
];

const ENERGY_LABELS = [
  { range: [1, 2], label: "Vyčerpaný/á", color: "text-red-600" },
  { range: [3, 4], label: "Unavený/á", color: "text-orange-600" },
  { range: [5, 6], label: "OK", color: "text-yellow-600" },
  { range: [7, 8], label: "Energický/á", color: "text-blue-600" },
  { range: [9, 10], label: "Plný/á energie", color: "text-green-600" },
];

const EXTERNAL_STRESSORS = [
  { id: "traffic", label: "Doprava/cesta" },
  { id: "health", label: "Zdraví" },
  { id: "family", label: "Rodina" },
  { id: "personal", label: "Osobní situace" },
  { id: "sleep", label: "Špatný spánek" },
];

export function MoodCheckinWidget() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [isOpen, setIsOpen] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [selectedStressors, setSelectedStressors] = useState<string[]>([]);
  const [wantsLighterDay, setWantsLighterDay] = useState(false);
  const [wantsDayOff, setWantsDayOff] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Check if user already checked in today
  useEffect(() => {
    const checkTodayStatus = async () => {
      try {
        const response = await fetch(
          `/api/${orgSlug}/analytics/daily-checkin/today`,
        );
        if (response.ok) {
          const data = await response.json();
          setHasCheckedToday(data.hasCheckedToday);
        }
      } catch (error) {
        console.error("Failed to check today's status:", error);
      }
    };

    if (orgSlug) {
      checkTodayStatus();
    }
  }, [orgSlug]);

  const handleSubmit = async () => {
    if (selectedMood === null) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      // Submit daily check-in with all context
      const response = await fetch(`/api/${orgSlug}/analytics/daily-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_score: selectedMood,
          stress_score: stressLevel,
          energy_level: energyLevel,
          external_stressors: selectedStressors,
          wants_lighter_day: wantsLighterDay,
          wants_day_off: wantsDayOff,
          notes: comment || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save daily check-in");
      }

      const data = await response.json();

      let message = "✅ Uloženo! ";
      if (wantsDayOff) {
        message += "Manažer byl upozorněn na tvou žádost o volno.";
      } else if (wantsLighterDay) {
        message += "Doporučíme ti dnes lehčí úkoly.";
      } else {
        message += "Přejeme hezký den!";
      }

      setSuccessMessage(message);
      setHasCheckedToday(true);

      setTimeout(() => {
        setIsOpen(false);
        setSelectedMood(null);
        setStressLevel(5);
        setEnergyLevel(7);
        setSelectedStressors([]);
        setWantsLighterDay(false);
        setWantsDayOff(false);
        setComment("");
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Chyba při ukládání. Zkus to znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStressor = (stressorId: string) => {
    setSelectedStressors((prev) =>
      prev.includes(stressorId)
        ? prev.filter((id) => id !== stressorId)
        : [...prev, stressorId],
    );
  };

  const getCurrentStressLabel = () => {
    const label = STRESS_LABELS.find(
      (l) => stressLevel >= l.range[0] && stressLevel <= l.range[1],
    );
    return label || STRESS_LABELS[2];
  };

  const getCurrentEnergyLabel = () => {
    const label = ENERGY_LABELS.find(
      (l) => energyLevel >= l.range[0] && energyLevel <= l.range[1],
    );
    return label || ENERGY_LABELS[2];
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 ${
          hasCheckedToday ? "bg-green-600" : "bg-blue-600"
        } text-white rounded-full p-4 shadow-lg hover:scale-105 transition-all z-50 relative`}
        title={
          hasCheckedToday ? "Check-in už máš za dnes hotový" : "Ranní check-in"
        }
      >
        <span className="text-2xl">{hasCheckedToday ? "✓" : "😊"}</span>
        {!hasCheckedToday && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Jak se dnes cítíš?
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {successMessage ? (
        <div className="text-center py-8">
          <p className="text-base text-green-600 font-medium whitespace-pre-line">
            {successMessage}
          </p>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto space-y-4">
          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nálada
            </label>
            <div className="flex gap-2 justify-between">
              {MOOD_EMOJIS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    selectedMood === mood.value
                      ? "bg-blue-100 border-2 border-blue-500 scale-110"
                      : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                  }`}
                  title={mood.label}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energie
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">🪫</span>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <span className="text-xs text-gray-500">🔋</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs font-medium ${
                  getCurrentEnergyLabel().color
                }`}
              >
                {getCurrentEnergyLabel().label}
              </span>
              <span className="text-lg font-bold text-gray-700">
                {energyLevel}
              </span>
            </div>
          </div>

          {/* Stress Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stres
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">😌</span>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <span className="text-xs text-gray-500">😰</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs font-medium ${
                  getCurrentStressLabel().color
                }`}
              >
                {getCurrentStressLabel().label}
              </span>
              <span className="text-lg font-bold text-gray-700">
                {stressLevel}
              </span>
            </div>
          </div>

          {/* External Stressors */}
          {(stressLevel >= 6 || (selectedMood && selectedMood <= 5)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Co ovlivňuje tvůj den? (volitelné)
              </label>
              <div className="flex flex-wrap gap-2">
                {EXTERNAL_STRESSORS.map((stressor) => (
                  <button
                    key={stressor.id}
                    type="button"
                    onClick={() => toggleStressor(stressor.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedStressors.includes(stressor.id)
                        ? "bg-orange-100 text-orange-800 border-2 border-orange-500"
                        : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                    }`}
                  >
                    {stressor.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day Preference */}
          {(stressLevel >= 7 ||
            energyLevel <= 4 ||
            (selectedMood && selectedMood <= 4)) && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-2">
              <p className="text-xs font-medium text-yellow-900 mb-2">
                Vypadá to, že máš náročnější den. Můžeme pomoct:
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsLighterDay}
                  onChange={(e) => setWantsLighterDay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Chci dnes lehčí úkoly
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsDayOff}
                  onChange={(e) => setWantsDayOff(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  Potřebuji volno (upozorníme manažera)
                </span>
              </label>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámka (volitelná)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Něco důležitého, co bychom měli vědět?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={selectedMood === null || isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Ukládám..." : "Uložit check-in"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Tvoje data vidíš jen ty a tvůj manažer
          </p>
        </div>
      )}
    </div>
  );
}
