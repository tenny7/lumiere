// Synthesized notification chime — no audio file needed. A short two-note
// "ding-dong" via the Web Audio API, scaled by volume (0–1).
export function playChime(volume = 0.5) {
  if (typeof window === "undefined") return
  const v = Math.max(0, Math.min(1, volume))
  if (v === 0) return
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    // Browsers start the context suspended until a user gesture; resume so the
    // chime is audible once the admin has interacted with the page at all.
    if (ctx.state === "suspended") ctx.resume().catch(() => {})
    const notes = [
      { freq: 880, at: 0 },
      { freq: 1174.66, at: 0.12 },
    ]
    for (const n of notes) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = "sine"
      o.frequency.value = n.freq
      const t = ctx.currentTime + n.at
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(v * 0.3, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
      o.start(t)
      o.stop(t + 0.27)
    }
    setTimeout(() => ctx.close(), 600)
  } catch {
    /* audio unavailable — ignore */
  }
}
