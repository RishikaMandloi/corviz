"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { nextPlaybackOperation, PlaybackOperation, PlaybackState, PlaybackTopic } from "./playback-plan";

type Topic = { id: string; name: string; category: string; summary: string; supportedOperations: string[] };
type Snapshot = { elements: unknown[]; pointers: Record<string, unknown>; statusMessage: string; metadata?: Record<string, unknown> };
type SceneObject = { id: string; type: string; name: string; position: { x: number; y: number }; scale?: { x: number; y: number; z: number }; properties?: Record<string, unknown> };
type Scene = { id: string; title: string; duration: number; objects: SceneObject[]; animations?: { id: string; objectId: string; type: string; startTime?: number; duration: number; from?: Record<string, unknown>; to?: Record<string, unknown>; easing?: string }[]; narration?: { text: string }; semanticIntent?: { operation: string; expectedStateSnapshot?: Snapshot } };
type NarrationSegment = { sceneId: string; order: number; text: string; start: number; duration: number; milestones: { timestamp: number; cue: string }[] };
type QuizQuestion = { id: string; question: string; options: { id: string; text: string }[]; correctAnswerId: string; explanation: string };
type Pipeline = {
  pipelineId: string;
  topic: Topic;
  stateTrace: { initialState: Snapshot; transitions: { resultingState: Snapshot; explanation: string }[]; finalState: Snapshot };
  sceneGraph: { scenes: Scene[]; totalDuration: number };
  verificationReport: { valid: boolean; errors: { message: string }[]; warnings: { message: string }[] };
  narrationScript: NarrationSegment[];
  writtenExplanation: { summary: string; keyPoints: string[]; steps: { step: number; title: string; detail: string }[]; invariants: string[]; edgeCases: string[] };
  dryRun: { columns: string[]; rows: { step: number; operation: string; stateRepresentation: string; variables: Record<string, unknown>; description: string }[] };
  quiz: { questions: QuizQuestion[] };
};
type Interaction = { success?: boolean; updatedState: Snapshot; transition: { stepIndex: number; operation: { type: string }; previousState: Snapshot; resultingState: Snapshot; explanation: string; isValidTransition: boolean }; updatedScene: Scene; verificationReport: Pipeline["verificationReport"]; dryRunRow: Pipeline["dryRun"]["rows"][number]; explanation: string; narration: NarrationSegment; quiz: Pipeline["quiz"] };
type PlaybackStatus = "idle" | "playing" | "paused" | "stopped" | "complete" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const FALLBACK_TOPICS: Topic[] = [
  ["STACK", "Stack (LIFO)", "DATA_STRUCTURE"], ["QUEUE", "Queue (FIFO)", "DATA_STRUCTURE"],
  ["BINARY_SEARCH", "Binary Search", "SEARCH_ALGORITHM"], ["BUBBLE_SORT", "Bubble Sort", "SORT_ALGORITHM"],
  ["LINEAR_SEARCH", "Linear Search", "SEARCH_ALGORITHM"], ["LINKED_LIST", "Singly Linked List", "DATA_STRUCTURE"],
  ["BST", "Binary Search Tree", "DATA_STRUCTURE"], ["SELECTION_SORT", "Selection Sort", "SORT_ALGORITHM"],
  ["TWO_POINTERS", "Two Pointers", "ALGORITHMIC_TECHNIQUE"], ["BFS", "Breadth-First Search", "GRAPH_ALGORITHM"],
].map(([id, name, category]) => ({ id, name, category, summary: "Verified deterministic learning pipeline.", supportedOperations: [] }));

function sceneStyle(object: SceneObject): CSSProperties {
  return { left: `${50 + object.position.x * 13}%`, top: `${50 - object.position.y * 15}%` };
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>(FALLBACK_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState("STACK");
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [operationValue, setOperationValue] = useState("50");
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError] = useState("");
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState("");
  const [tutorHistory, setTutorHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [narrationSpeaking, setNarrationSpeaking] = useState(false);
  const [narrationPaused, setNarrationPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pipelineRef = useRef<Pipeline | null>(null);
  const playbackStatusRef = useRef<PlaybackStatus>("idle");
  const playbackTaskRef = useRef<Promise<void> | null>(null);
  const playbackStartingRef = useRef(false);
  const playbackAbortRef = useRef<AbortController | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const playbackGenerationRef = useRef(0);
  const playbackCursorRef = useRef(0);
  const introPlayedRef = useRef(false);
  const sessionNeedsResetRef = useRef(false);
  const speedRef = useRef(speed);
  const narrationEnabledRef = useRef(narrationEnabled);
  const speechResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/pipeline/topics`).then((r) => r.ok ? r.json() : Promise.reject(new Error("Unable to load topic catalog")))
      .then((body) => setTopics(body.data as Topic[])).catch(() => undefined);
  }, []);

  useEffect(() => {
    const generation = ++playbackGenerationRef.current;
    const controller = new AbortController();
    playbackAbortRef.current?.abort();
    requestAbortRef.current?.abort();
    playbackAbortRef.current = null;
    requestAbortRef.current = controller;
    playbackTaskRef.current = null;
    playbackStartingRef.current = false;
    playbackStatusRef.current = "idle";
    sessionNeedsResetRef.current = false;
    playbackCursorRef.current = 0;
    introPlayedRef.current = false;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechResolveRef.current?.();
    speechResolveRef.current = null;
    utteranceRef.current = null;
    setNarrationSpeaking(false);
    setNarrationPaused(false);
    setPlaybackStatus("idle");
    setLoading(true); setPipeline(null); pipelineRef.current = null; setError(""); setStep(0); setPlaying(false); setAnswer(null); setFeedback("");
    fetch(`${API_BASE}/pipeline/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId: selectedTopic, initializeOnly: true }), signal: controller.signal })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.message ?? "Pipeline generation failed"); return body.data as Pipeline; })
      .then((data) => { if (generation === playbackGenerationRef.current) { pipelineRef.current = data; setPipeline(data); } })
      .catch((cause: Error) => { if (!controller.signal.aborted && generation === playbackGenerationRef.current) { setPipeline(null); pipelineRef.current = null; setError(`${cause.message}. Start the backend on port 5000 to load this verified lesson.`); } })
      .finally(() => { if (generation === playbackGenerationRef.current) setLoading(false); });
    return () => { controller.abort(); };
  }, [selectedTopic]);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { narrationEnabledRef.current = narrationEnabled; }, [narrationEnabled]);

  const scenes = pipeline?.sceneGraph.scenes ?? [];
  const getStepNarration = (targetStep: number) => {
    if (!pipeline) return "";
    return pipeline.narrationScript[targetStep]?.text ?? scenes[targetStep]?.narration?.text ?? pipeline.dryRun.rows[targetStep]?.description ?? "";
  };
  const getStepSnapshot = (targetStep: number) => {
    if (!pipeline) return undefined;
    if (targetStep <= 0) return pipeline.stateTrace.initialState;
    return pipeline.stateTrace.transitions[targetStep - 1]?.resultingState ?? pipeline.stateTrace.finalState;
  };
  const activeScene = scenes[step] ?? scenes[scenes.length - 1];
  const activeRow = pipeline?.dryRun.rows[step] ?? pipeline?.dryRun.rows.at(-1);
  const activeQuestion = pipeline ? pipeline.quiz.questions[quizIndex] : undefined;
  const activeNarration = getStepNarration(step) || activeScene?.narration?.text || activeRow?.description || "";
  const snapshot = useMemo(() => getStepSnapshot(step), [pipeline, step]);

  useEffect(() => {
    const activeAnimations: Animation[] = [];
    activeScene?.animations?.forEach((animation) => {
      const element = document.getElementById(`scene-object-${animation.objectId}`);
      if (!element) return;
      const duration = Math.max(200, animation.duration * 1000 / speed);
      const delay = Math.max(0, (animation.startTime ?? 0) * 1000 / speed);
      let keyframes: Keyframe[];
      if (animation.type === "TRANSLATE" && animation.from && animation.to) {
        const from = animation.from as { x?: number; y?: number };
        const to = animation.to as { x?: number; y?: number };
        keyframes = [
          { left: `${50 + (from.x ?? 0) * 13}%`, top: `${50 - (from.y ?? 0) * 15}%` },
          { left: `${50 + (to.x ?? 0) * 13}%`, top: `${50 - (to.y ?? 0) * 15}%` },
        ];
        element.style.opacity = "1";
        element.style.left = `${50 + (to.x ?? 0) * 13}%`;
        element.style.top = `${50 - (to.y ?? 0) * 15}%`;
      } else if (animation.type === "APPEAR") {
        keyframes = [{ opacity: animation.from?.opacity as number ?? 0 }, { opacity: animation.to?.opacity as number ?? 1 }];
        element.style.opacity = String(animation.to?.opacity as number ?? 1);
      } else {
        keyframes = [
          { filter: "brightness(1)", transform: "translate(-50%, -50%) scale(1)" },
          { filter: "brightness(1.8)", transform: "translate(-50%, -50%) scale(1.12)" },
          { filter: "brightness(1)", transform: "translate(-50%, -50%) scale(1)" },
        ];
      }
      activeAnimations.push(element.animate(keyframes, {
        duration,
        delay,
        easing: animation.easing ?? "ease-in-out",
        fill: "both",
      }));
    });
    return () => activeAnimations.forEach((animation) => animation.cancel());
  }, [activeScene?.id, speed]);

  const generateInteractiveSession = async (topicId: string, signal: AbortSignal): Promise<Pipeline> => {
    const response = await fetch(`${API_BASE}/pipeline/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, initializeOnly: true }),
      signal,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? "Unable to reset the verified lesson session.");
    const fresh = body.data as Pipeline;
    if (!fresh?.verificationReport?.valid || fresh.stateTrace.transitions.length !== 0 || fresh.sceneGraph.scenes.length !== 1) {
      throw new Error("The backend did not return a verified initial-only lesson session.");
    }
    return fresh;
  };

  const updateSessionFromInteraction = (current: Pipeline, data: Interaction): Pipeline => {
    if (!data?.verificationReport?.valid) {
      throw new Error(data?.verificationReport?.errors?.map((item) => item.message).join(" ") || "VKVE rejected this operation.");
    }
    if (!data.transition?.isValidTransition || !data.updatedScene || !data.narration || !data.dryRunRow) {
      throw new Error("The backend returned an incomplete or invalid operation result; it was not rendered.");
    }
    if (JSON.stringify(data.transition.previousState) !== JSON.stringify(current.stateTrace.finalState)) {
      throw new Error("The backend transition did not start from the current authoritative session state.");
    }
    if (JSON.stringify(data.transition.resultingState) !== JSON.stringify(data.updatedState)) {
      throw new Error("The backend transition state and updated state do not match.");
    }
    if (JSON.stringify(data.updatedScene.semanticIntent?.expectedStateSnapshot) !== JSON.stringify(data.updatedState)) {
      throw new Error("The backend scene is not bound to the verified resulting state.");
    }
    if (data.narration.sceneId !== data.updatedScene.id || data.narration.text !== data.updatedScene.narration?.text) {
      throw new Error("The backend narration does not match the verified operation scene.");
    }

    return {
      ...current,
      verificationReport: data.verificationReport,
      stateTrace: {
        ...current.stateTrace,
        transitions: [...current.stateTrace.transitions, data.transition],
        finalState: data.updatedState,
      },
      sceneGraph: {
        ...current.sceneGraph,
        scenes: [...current.sceneGraph.scenes, data.updatedScene],
        totalDuration: current.sceneGraph.totalDuration + data.updatedScene.duration,
      },
      narrationScript: [...current.narrationScript, data.narration],
      dryRun: { ...current.dryRun, rows: [...current.dryRun.rows, data.dryRunRow] },
      quiz: data.quiz,
      writtenExplanation: {
        ...current.writtenExplanation,
        steps: [...current.writtenExplanation.steps, {
          step: data.transition.stepIndex,
          title: `${data.transition.operation.type} Operation`,
          detail: data.transition.explanation,
        }],
      },
    };
  };

  const assertPlaybackActive = (signal: AbortSignal, generation: number) => {
    if (signal.aborted || generation !== playbackGenerationRef.current || playbackStatusRef.current === "stopped") {
      throw new DOMException("Playback cancelled", "AbortError");
    }
  };

  const waitUntilResumed = async (signal: AbortSignal, generation: number) => {
    while (playbackStatusRef.current === "paused") {
      assertPlaybackActive(signal, generation);
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    assertPlaybackActive(signal, generation);
  };

  const waitForVisualDuration = async (durationMs: number, signal: AbortSignal, generation: number) => {
    let progressed = 0;
    let lastTick = Date.now();
    while (progressed < durationMs) {
      await waitUntilResumed(signal, generation);
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      const now = Date.now();
      if (playbackStatusRef.current === "playing") progressed += (now - lastTick) * speedRef.current;
      lastTick = now;
    }
  };

  const speakSegment = async (text: string, signal: AbortSignal, generation: number) => {
    if (!text || !narrationEnabledRef.current || !("speechSynthesis" in window)) return;
    await waitUntilResumed(signal, generation);
    if (!narrationEnabledRef.current) return;
    await new Promise<void>((resolve) => {
      let settled = false;
      let utterance: SpeechSynthesisUtterance;
      const handleAbort = () => finish();
      const finish = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", handleAbort);
        if (speechResolveRef.current === finish) speechResolveRef.current = null;
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        setNarrationSpeaking(false);
        resolve();
      };
      utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speedRef.current;
      utterance.onstart = () => { setNarrationSpeaking(true); };
      utterance.onend = finish;
      utterance.onerror = finish;
      speechResolveRef.current = finish;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setNarrationSpeaking(true);
      signal.addEventListener("abort", handleAbort, { once: true });
    });
    assertPlaybackActive(signal, generation);
  };

  const presentVerifiedScene = async (scene: Scene, narrationText: string, signal: AbortSignal, generation: number) => {
    await waitUntilResumed(signal, generation);
    const visualDuration = Math.max(600, scene.duration * 1000);
    await Promise.all([
      waitForVisualDuration(visualDuration, signal, generation),
      speakSegment(narrationText, signal, generation),
    ]);
    assertPlaybackActive(signal, generation);
  };

  const stopSpeechOnly = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    speechResolveRef.current?.();
    speechResolveRef.current = null;
    utteranceRef.current = null;
    setNarrationSpeaking(false);
  };

  const runPlayback = async (freshSession: Pipeline, controller: AbortController, generation: number) => {
    if (playbackStatusRef.current !== "paused") {
      playbackStatusRef.current = "playing";
      setPlaybackStatus("playing");
      setPlaying(true);
    }
    pipelineRef.current = freshSession;
    setPipeline(freshSession);
    setStep(0);
    playbackCursorRef.current = 0;
    introPlayedRef.current = false;
    sessionNeedsResetRef.current = false;

    try {
      const signal = controller.signal;
      if (!introPlayedRef.current) {
        const intro = freshSession.narrationScript[0]?.text ?? freshSession.sceneGraph.scenes[0]?.narration?.text ?? "";
        await presentVerifiedScene(freshSession.sceneGraph.scenes[0], intro, signal, generation);
        introPlayedRef.current = true;
      }

      while (true) {
        await waitUntilResumed(signal, generation);
        const current = pipelineRef.current;
        if (!current) throw new Error("The verified lesson session is no longer available.");
        const nextOperation = nextPlaybackOperation(
          current.topic.id as PlaybackTopic,
          current.stateTrace.finalState as PlaybackState,
          current.stateTrace.initialState as PlaybackState,
          playbackCursorRef.current,
        );
        if (!nextOperation) {
          playbackStatusRef.current = "complete";
          setPlaybackStatus("complete");
          setPlaying(false);
          setNarrationPaused(false);
          setNarrationSpeaking(false);
          return;
        }

        const operationController = new AbortController();
        requestAbortRef.current = operationController;
        const abortOperation = () => operationController.abort();
        signal.addEventListener("abort", abortOperation, { once: true });
        let response: Response;
        try {
          response = await fetch(`${API_BASE}/pipeline/interact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pipelineId: current.pipelineId, operation: nextOperation }),
            signal: operationController.signal,
          });
        } finally {
          signal.removeEventListener("abort", abortOperation);
        }
        const body = await response.json();
        assertPlaybackActive(signal, generation);
        if (!response.ok) throw new Error(body.message ?? "The backend rejected the next algorithm operation.");
        const data = body.data as Interaction;
        const updated = updateSessionFromInteraction(current, data);
        pipelineRef.current = updated;
        setPipeline(updated);
        setStep(updated.sceneGraph.scenes.length - 1);
        setAnswer(null);
        setFeedback(data.explanation);
        playbackCursorRef.current += 1;
        await presentVerifiedScene(data.updatedScene, data.narration.text, signal, generation);
      }
    } catch (cause) {
      if (controller.signal.aborted || generation !== playbackGenerationRef.current) return;
      const message = cause instanceof Error ? cause.message : "Automatic playback failed.";
      playbackStatusRef.current = "error";
      setPlaybackStatus("error");
      setInteractionError(message);
      setPlaying(false);
      setNarrationPaused(false);
    } finally {
      if (playbackAbortRef.current === controller && playbackStatusRef.current !== "paused") {
        playbackAbortRef.current = null;
      }
    }
  };

  const startPlayback = async (forceReset = false) => {
    if (playbackStatusRef.current === "paused" && !forceReset) {
      playbackStatusRef.current = "playing";
      setPlaybackStatus("playing");
      setPlaying(true);
      setNarrationPaused(false);
      if ("speechSynthesis" in window && window.speechSynthesis.paused) window.speechSynthesis.resume();
      return;
    }
    if (playbackTaskRef.current || playbackStartingRef.current) return;

    let current = pipelineRef.current;
    if (!current || current.verificationReport.valid !== true) return;
    const shouldReset = forceReset
      || sessionNeedsResetRef.current
      || playbackStatusRef.current === "complete"
      || playbackStatusRef.current === "stopped"
      || playbackStatusRef.current === "error"
      || (current.stateTrace.transitions.length > 0 && playbackCursorRef.current === 0);
    const generation = ++playbackGenerationRef.current;
    playbackStartingRef.current = true;
    const controller = new AbortController();
    playbackAbortRef.current = controller;
    requestAbortRef.current?.abort();
    setInteractionError("");
    setNarrationPaused(false);
    playbackStatusRef.current = "playing";
    setPlaybackStatus("playing");
    setPlaying(true);

    try {
      if (shouldReset) {
        stopSpeechOnly();
        current = await generateInteractiveSession(current.topic.id, controller.signal);
      }
      const task = runPlayback(current, controller, generation);
      playbackTaskRef.current = task;
      await task;
    } catch (cause) {
      if (!controller.signal.aborted && generation === playbackGenerationRef.current) {
        const message = cause instanceof Error ? cause.message : "Unable to start automatic playback.";
        playbackStatusRef.current = "error";
        setPlaybackStatus("error");
        setInteractionError(message);
        setPlaying(false);
      }
    } finally {
      if (generation === playbackGenerationRef.current) {
        playbackStartingRef.current = false;
        if (playbackAbortRef.current === controller) playbackAbortRef.current = null;
        playbackTaskRef.current = null;
      }
    }
  };

  const pausePlayback = () => {
    if (playbackStatusRef.current !== "playing") return;
    playbackStatusRef.current = "paused";
    setPlaybackStatus("paused");
    setPlaying(false);
    setNarrationPaused(true);
    setNarrationSpeaking(false);
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) window.speechSynthesis.pause();
  };

  const stopPlayback = () => {
    playbackGenerationRef.current += 1;
    playbackStatusRef.current = "stopped";
    sessionNeedsResetRef.current = true;
    playbackAbortRef.current?.abort();
    requestAbortRef.current?.abort();
    playbackAbortRef.current = null;
    playbackTaskRef.current = null;
    playbackStartingRef.current = false;
    stopSpeechOnly();
    setPlaybackStatus("stopped");
    setPlaying(false);
    setNarrationPaused(false);
  };

  const playNarration = (text = activeNarration) => {
    if (playbackStatusRef.current === "playing" || playbackStatusRef.current === "paused") return;
    stopSpeechOnly();
    if (!text || !narrationEnabled || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speedRef.current;
    utterance.onstart = () => setNarrationSpeaking(true);
    utterance.onend = () => { setNarrationSpeaking(false); utteranceRef.current = null; };
    utterance.onerror = () => { setNarrationSpeaking(false); utteranceRef.current = null; };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setNarrationSpeaking(true);
    setNarrationPaused(false);
  };

  const pauseNarration = () => {
    if (playbackStatusRef.current === "playing") {
      pausePlayback();
      return;
    }
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) window.speechSynthesis.pause();
    setNarrationSpeaking(false);
    setNarrationPaused(true);
  };

  const resumeNarration = () => {
    if (playbackStatusRef.current === "paused") {
      void startPlayback();
      return;
    }
    if ("speechSynthesis" in window && window.speechSynthesis.paused) window.speechSynthesis.resume();
    setNarrationPaused(false);
    setNarrationSpeaking(true);
  };

  const toggleTimeline = () => {
    if (playbackStatusRef.current === "playing") pausePlayback();
    else void startPlayback();
  };

  const replayTimeline = () => {
    playbackGenerationRef.current += 1;
    playbackAbortRef.current?.abort();
    requestAbortRef.current?.abort();
    playbackTaskRef.current = null;
    playbackStartingRef.current = false;
    stopSpeechOnly();
    playbackStatusRef.current = "idle";
    setPlaybackStatus("idle");
    setStep(0);
    void startPlayback(true);
  };

  useEffect(() => {
    setTutorQuestion("");
    setTutorAnswer("");
    setTutorError("");
    setTutorHistory([]);
  }, [selectedTopic]);

  useEffect(() => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizComplete(false);
    setAnswer(null);
    setFeedback("");
  }, [pipeline?.pipelineId, selectedTopic]);

  const speakTutorAnswer = () => {
    if (!tutorAnswer || !("speechSynthesis" in window)) return;
    if (narrationEnabled && (playing || narrationSpeaking)) {
      setTutorError("Pause the lesson narration before reading the tutor answer aloud.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(tutorAnswer);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const askTutor = async () => {
    if (!pipeline) return;
    const question = tutorQuestion.trim();
    if (!question) {
      setTutorError("Type a question before asking the tutor.");
      return;
    }

    setTutorLoading(true);
    setTutorError("");
    try {
      const response = await fetch(`${API_BASE}/tutor/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic,
          question,
          pipelineId: pipeline.pipelineId,
          currentState: snapshot,
          transition: pipeline.stateTrace.transitions.at(-1),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Tutor request failed");
      const answer = body.data?.answer ?? "No answer available.";
      setTutorAnswer(answer);
      setTutorHistory((current) => [...current, { question, answer }]);
      setTutorQuestion("");
    } catch (cause) {
      setTutorError(cause instanceof Error ? cause.message : "Tutor request failed.");
    } finally {
      setTutorLoading(false);
    }
  };

  const submitAnswer = () => {
    if (!activeQuestion || !answer) return setFeedback("Select an answer first.");
    const isCorrect = answer === activeQuestion.correctAnswerId;
    setQuizScore((current) => current + (isCorrect ? 1 : 0));
    setFeedback(isCorrect ? `Correct — ${activeQuestion.explanation}` : `Not quite — ${activeQuestion.explanation}`);

    const totalQuestions = pipeline?.quiz.questions.length ?? 1;
    if (quizIndex >= totalQuestions - 1) {
      setQuizComplete(true);
      return;
    }

    setTimeout(() => {
      setQuizIndex((current) => current + 1);
      setAnswer(null);
      setFeedback("");
    }, 700);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizComplete(false);
    setAnswer(null);
    setFeedback("");
  };
  const operationButtons: Record<string, string[]> = { STACK: ["PUSH", "POP", "PEEK"], QUEUE: ["ENQUEUE", "DEQUEUE", "PEEK"], BINARY_SEARCH: ["SEARCH"], BUBBLE_SORT: ["COMPARE_AND_SWAP"], LINEAR_SEARCH: ["SEARCH"], LINKED_LIST: ["INSERT_HEAD", "DELETE_HEAD"], BST: ["INSERT", "SEARCH"], SELECTION_SORT: ["FIND_MIN_AND_SWAP"], TWO_POINTERS: ["SWAP_AND_ADVANCE"], BFS: ["VISIT_AND_EXPAND"] };

  const getOperationValueLabel = (type: string) => {
    if (type === "VISIT_AND_EXPAND") return "Next queued vertex";
    if (["PUSH", "ENQUEUE", "INSERT", "INSERT_HEAD"].includes(type)) return "Value";
    if (["SEARCH", "TARGET", "COMPARE_AND_SWAP", "FIND_MIN_AND_SWAP", "SWAP_AND_ADVANCE"].includes(type)) return "Target / index";
    return "Value";
  };

  const describeSceneObject = (object: SceneObject) => {
    const properties = object.properties ?? {};
    if (object.type === "CONTAINER" && Array.isArray(properties.queue)) {
      const queueText = (properties.queue as unknown[]).join(", ") || "empty";
      const visitedText = Array.isArray(properties.visited) ? (properties.visited as unknown[]).join(", ") || "none" : "";
      return `${String(properties.label ?? object.name)}\nQUEUE: ${queueText}${visitedText ? `\nVISITED: ${visitedText}` : ""}`;
    }
    if (object.type === "POINTER") {
      const target = properties.targetIndex;
      const targetVertex = properties.targetVertex;
      return `${String(properties.label ?? object.name)}${target !== undefined ? `\nindex ${String(target)}` : targetVertex !== undefined ? `\n${String(targetVertex)}` : ""}`;
    }
    if (properties.value !== undefined && properties.nextIndex !== undefined) {
      const next = properties.nextIndex === null ? "null" : String(snapshot?.elements[Number(properties.nextIndex)] ?? properties.nextIndex);
      return `Node ${String(properties.value)}\nnext → ${next}`;
    }
    if (properties.value !== undefined && properties.leftIndex !== undefined) {
      const childLabel = (index: unknown) => index === null ? "null" : String(snapshot?.elements[Number(index)] ?? index);
      return `${String(properties.value)}\nL:${childLabel(properties.leftIndex)} R:${childLabel(properties.rightIndex)}`;
    }
    if (properties.value !== undefined && properties.index !== undefined) {
      return `${String(properties.value)}\nindex ${String(properties.index)}`;
    }
    return String(properties.label ?? object.name);
  };

  const buildOperation = (type: string, valueInput: string, sourceState: Snapshot | undefined = snapshot) => {
    switch (type) {
      case "PUSH":
      case "ENQUEUE":
      case "INSERT":
      case "INSERT_HEAD": {
        const value = Number(valueInput);
        if (!Number.isFinite(value)) throw new Error("Enter a valid numeric value for this operation.");
        return { type, payload: { value } };
      }
      case "SEARCH": {
        const target = Number(valueInput);
        if (!Number.isFinite(target)) throw new Error("Enter a valid numeric target for this search.");
        return { type, payload: { target } };
      }
      case "COMPARE_AND_SWAP": {
        const currentJ = Number(sourceState?.pointers?.j ?? 0);
        return { type, payload: { j: currentJ, jPlus1: currentJ + 1 } };
      }
      case "FIND_MIN_AND_SWAP": {
        const boundary = Number(sourceState?.pointers?.sortedBoundary ?? 0);
        return { type, payload: { i: boundary } };
      }
      case "SWAP_AND_ADVANCE": {
        const left = Number(sourceState?.pointers?.left ?? 0);
        const right = Number(sourceState?.pointers?.right ?? (Array.isArray(sourceState?.elements) ? sourceState.elements.length - 1 : 0));
        return { type, payload: { left, right } };
      }
      case "VISIT_AND_EXPAND": {
        const vertex = (sourceState?.metadata?.queue as string[] | undefined)?.[0];
        if (!vertex) throw new Error("BFS traversal is complete; there is no queued vertex to expand.");
        return { type, payload: { vertex } };
      }
      default:
        return { type };
    }
  };

  const interact = async (type: string) => {
    if (playbackStatusRef.current === "playing" || playbackStatusRef.current === "paused") {
      setInteractionError("Pause or stop automatic playback before using a manual operation.");
      return;
    }
    let current = pipelineRef.current;
    if (!current) return;
    setInteractionLoading(true); setInteractionError("");
    const controller = new AbortController();
    requestAbortRef.current?.abort();
    requestAbortRef.current = controller;
    try {
      if (sessionNeedsResetRef.current) {
        current = await generateInteractiveSession(current.topic.id, controller.signal);
        pipelineRef.current = current;
        setPipeline(current);
        setStep(0);
        sessionNeedsResetRef.current = false;
      }
      const operation = buildOperation(type, operationValue, current.stateTrace.finalState);
      const response = await fetch(`${API_BASE}/pipeline/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId: current.pipelineId, operation }),
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Interaction failed");

      const data = body.data as Interaction;
      const updated = updateSessionFromInteraction(current, data);
      pipelineRef.current = updated;
      setPipeline(updated);
      setAnswer(null);
      setStep(updated.sceneGraph.scenes.length - 1);
      setFeedback(data.explanation || "Operation executed successfully.");
      playbackStatusRef.current = "idle";
      setPlaybackStatus("idle");
      setPlaying(false);
      setInteractionError("");
    } catch (cause) {
      if (!controller.signal.aborted) setInteractionError(cause instanceof Error ? cause.message : "Interaction failed");
    } finally {
      setInteractionLoading(false);
    }
  };

  return <div className={styles.page}><main className={styles.main}>
    <section className={styles.hero}>
      <p className={styles.topic}>AI-POWERED COMPUTER SCIENCE LEARNING PLATFORM</p><h1 className={styles.heading}>Verified Visual Learning Experience</h1>
      <p className={styles.tagline}>Every lesson runs through canonical knowledge, deterministic execution, scene generation, and semantic verification.</p>
      <div className={styles.timelineRow}><label htmlFor="topic-selector">Topic</label><select id="topic-selector" className={styles.topicSelect} value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name} [{topic.category}]</option>)}</select>{pipeline && <span className={`${styles.verificationBadge} ${pipeline.verificationReport.valid ? styles.badgePassed : styles.badgeFailed}`}>{pipeline.verificationReport.valid ? "● VKVE VERIFIED" : "● VERIFICATION FAILED"}</span>}</div>
      <nav className={styles.sectionNav} aria-label="Lesson sections">
        <a href="#lesson-stage">Lesson & playback</a>
        <a href="#verified-explanation">Explanation</a>
        <a href="#dry-run">Dry run</a>
        <a href="#ai-tutor">AI Tutor</a>
        <a href="#knowledge-check">Knowledge check</a>
      </nav>
    </section>
    <section className={styles.lessonGrid}>
      <article className={styles.videoSection} id="lesson-stage">
        <div className={styles.timelineRow}><h2>{pipeline?.topic.name ?? selectedTopic}</h2><span>Scene {scenes.length ? step + 1 : 0} of {scenes.length}</span></div>
        <div className={styles.visualCanvasWrapper} aria-live="polite">{loading && <p>Generating the verified lesson…</p>}{error && <p className={styles.feedback}>{error}</p>}{activeScene && <><p className={styles.sceneHeading}>{activeScene.semanticIntent?.operation ?? "INITIALIZE"}: {activeScene.title}</p>{activeScene.objects.map((object) => { const objectAnimation = activeScene.animations?.find((animation) => animation.objectId === object.id); const properties = object.properties ?? {}; if (object.type === "EDGE") return <div id={`scene-object-${object.id}`} key={object.id} className={styles.sceneEdge} style={{ ...sceneStyle(object), width: `${Math.max(5, (object.scale?.x ?? 1) * 13)}%`, transform: `translate(-50%, -50%) rotate(${Number(properties.angle ?? 0)}deg)`, background: properties.isNewlyDiscovered ? "#34d399" : "rgba(147, 197, 253, .68)" }} aria-label={`${String(properties.from)} to ${String(properties.to)}`} />; const background = object.type === "POINTER" || properties.isCurrent === true ? "#f59e0b" : object.type === "CONTAINER" ? "rgba(59,130,246,.35)" : properties.isVisited === true ? "#059669" : properties.isOnTraversalPath === true ? "#7c3aed" : "#2563eb"; const isSwapTarget = objectAnimation?.type === "HIGHLIGHT" && activeScene.semanticIntent?.operation === "COMPARE_AND_SWAP" && (properties.index === Number(activeRow?.variables?.j) || properties.index === Number(activeRow?.variables?.jPlus1)); return <div id={`scene-object-${object.id}`} key={object.id} className={styles.sceneObject} style={{ ...sceneStyle(object), opacity: objectAnimation?.type === "APPEAR" ? 0 : 1, borderRadius: object.type === "NODE" ? "50%" : 8, background, outline: isSwapTarget ? "2px solid #fbbf24" : undefined }} title={object.name}>{describeSceneObject(object)}</div>; })}</>}</div>
        <div className={styles.operationSummary}>
          <strong>{activeScene?.semanticIntent?.operation === "INITIALIZE" ? "Starting state" : `Current operation: ${activeScene?.semanticIntent?.operation ?? "—"}`}</strong>
          <span>{activeRow?.description ?? snapshot?.statusMessage ?? "Waiting for the verified lesson."}</span>
          {playbackStatus === "complete" && pipeline?.verificationReport.valid && <span className={styles.completionStatus} role="status">Verified algorithm sequence complete. Final state is shown above.</span>}
          {playbackStatus === "error" && <span className={styles.playbackError} role="alert">Playback stopped because the backend could not verify the next operation.</span>}
        </div>
        <div className={styles.timelineRow}><button className={styles.smallButton} type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || playing || interactionLoading}>◀ Step back</button><button className={styles.primaryButton} type="button" onClick={toggleTimeline} disabled={!scenes.length || loading || interactionLoading}>{playing ? "Pause timeline" : playbackStatus === "complete" ? "Play algorithm again" : "Play timeline"}</button><button className={styles.smallButton} type="button" onClick={stopPlayback} disabled={!playing && playbackStatus !== "paused"}>Stop timeline</button><button className={styles.smallButton} type="button" onClick={replayTimeline} disabled={!scenes.length || loading || interactionLoading}>Replay timeline</button><button className={styles.smallButton} type="button" onClick={() => setStep(Math.min(scenes.length - 1, step + 1))} disabled={step >= scenes.length - 1 || playing || interactionLoading}>Step forward ▶</button>{[0.5, 1, 1.5].map((value) => <button key={value} className={styles.smallButton} type="button" onClick={() => setSpeed(value)} aria-pressed={speed === value}>{value}×</button>)}</div>
        <div className={styles.sectionCard} aria-label="Teacher narration controls">
          <h3>Teacher narration</h3>
          <p className={styles.paragraph} aria-live="polite">{activeNarration ?? "Narration will appear with the verified lesson."}</p>
          <div className={styles.timelineRow}>
            <button className={styles.primaryButton} type="button" onClick={() => playNarration()} disabled={!narrationEnabled || !activeNarration || playing}>Play narration</button>
            <button className={styles.smallButton} type="button" onClick={pauseNarration} disabled={!narrationSpeaking || narrationPaused}>Pause</button>
            <button className={styles.smallButton} type="button" onClick={resumeNarration} disabled={!narrationPaused}>Resume</button>
            <button className={styles.smallButton} type="button" onClick={() => { stopSpeechOnly(); setNarrationPaused(false); }} disabled={!narrationSpeaking && !narrationPaused}>Stop</button>
            <button className={styles.smallButton} type="button" onClick={() => playNarration()} disabled={!narrationEnabled || !activeNarration || playing}>Replay current explanation</button>
            <button className={styles.secondaryButton} type="button" aria-pressed={narrationEnabled} onClick={() => { const enabled = !narrationEnabled; narrationEnabledRef.current = enabled; setNarrationEnabled(enabled); if (!enabled) stopSpeechOnly(); }}>{narrationEnabled ? "Disable narration" : "Enable narration"}</button>
            <span role="status">{playbackStatus === "complete" ? "Verified lesson complete" : playbackStatus === "paused" ? "Narration paused" : playbackStatus === "playing" ? (narrationEnabled ? narrationSpeaking ? "Narration playing" : "Visual operation in progress" : "Narration disabled" ) : narrationEnabled ? "Narration ready" : "Narration disabled"}</span>
          </div>
        </div>
        {pipeline && <div className={styles.sectionCard}><h3>Interactive operation</h3><p className={styles.paragraph}>Operations execute through the verified backend state machine.</p><div className={styles.timelineRow}><input className={styles.numberInput} aria-label="Operation value or search target" value={operationValue} onChange={(event) => setOperationValue(event.target.value)} placeholder={getOperationValueLabel(operationButtons[selectedTopic]?.[0] ?? "VALUE")} disabled={playing || interactionLoading} /><span>{getOperationValueLabel(operationButtons[selectedTopic]?.[0] ?? "VALUE")}</span>{operationButtons[selectedTopic]?.map((operation) => <button key={operation} className={styles.smallButton} type="button" disabled={interactionLoading || playing || playbackStatus === "paused"} onClick={() => interact(operation)}>{interactionLoading ? "Working…" : operation.replaceAll("_", " ")}</button>)}</div>{interactionError && <p className={styles.feedback}>{interactionError}</p>}</div>}
        {snapshot && <div className={styles.sectionCard}><strong>Current deterministic state</strong><p className={styles.paragraph}>Elements: [{snapshot.elements.join(", ")}]</p><p className={styles.paragraph}>Pointers: {Object.entries(snapshot.pointers).map(([key, value]) => `${key}=${String(value)}`).join(", ")}</p><p className={styles.paragraph}>{snapshot.statusMessage}</p></div>}
      </article>
      <div className={styles.learningPanels}>
        {pipeline && <article className={styles.sectionCard} id="verified-explanation"><h2>Verified explanation</h2><p className={styles.paragraph}>{pipeline.writtenExplanation.summary}</p><ul>{pipeline.writtenExplanation.invariants.map((invariant) => <li key={invariant}>{invariant}</li>)}</ul></article>}
        {pipeline && <article className={styles.sectionCard} id="dry-run"><h2>Deterministic dry run</h2><div className={styles.dryRunTable}>{pipeline.dryRun.rows.map((row) => <button key={row.step} className={styles.tableRow} type="button" onClick={() => setStep(row.step)} style={{ textAlign: "left", border: row.step === step ? "1px solid #60a5fa" : undefined }}><strong>{row.step}. {row.operation}</strong><span>{row.stateRepresentation}</span><small>{row.description}</small></button>)}</div></article>}
        {pipeline && <article className={styles.sectionCard} id="ai-tutor"><h2>AI Tutor</h2><div className={styles.tutorInputGroup}><textarea className={styles.tutorInput} value={tutorQuestion} onChange={(event) => setTutorQuestion(event.target.value)} placeholder="Ask about the current state, concept, or step..." rows={4} /></div><div className={styles.timelineRow}><button className={styles.primaryButton} type="button" onClick={askTutor} disabled={tutorLoading}>{tutorLoading ? "Asking…" : "Ask Tutor"}</button><button className={styles.smallButton} type="button" onClick={() => { setTutorQuestion(""); setTutorAnswer(""); setTutorError(""); setTutorHistory([]); }} disabled={!tutorQuestion && !tutorAnswer}>Clear</button>{tutorAnswer && <button className={styles.smallButton} type="button" onClick={speakTutorAnswer} disabled={narrationEnabled && (playing || narrationSpeaking)}>Read answer aloud</button>}</div>{tutorError && <p className={styles.feedback}>{tutorError}</p>}<div className={styles.tutorAnswer} aria-live="polite">{tutorAnswer || "Ask a question to get a verified explanation for the current topic and state."}</div>{tutorHistory.length > 0 && <div className={styles.tutorHistory}><strong>Recent questions</strong>{tutorHistory.slice(-3).map((item) => <div key={`${item.question}-${item.answer}`} className={styles.tutorHistoryItem}><p><strong>Q:</strong> {item.question}</p><p><strong>A:</strong> {item.answer}</p></div>)}</div>}</article>}
        {activeQuestion && <article className={styles.sectionCard} id="knowledge-check"><h2>Verified knowledge check</h2>{pipeline && <p className={styles.paragraph}>Question {Math.min(quizIndex + 1, pipeline.quiz.questions.length)} of {pipeline.quiz.questions.length}</p>}<p className={styles.paragraph}>{activeQuestion.question}</p><div className={styles.quizOptions}>{activeQuestion.options.map((option) => <button key={option.id} className={`${styles.quizOption} ${answer === option.id ? styles.selectedOption : ""}`} type="button" onClick={() => setAnswer(option.id)}>{option.text}</button>)}</div><div className={styles.quizActions}><button className={styles.primaryButton} type="button" onClick={submitAnswer} disabled={!answer || quizComplete}>Check answer</button>{quizComplete && <button className={styles.smallButton} type="button" onClick={resetQuiz}>Restart quiz</button>}{feedback && <p className={styles.feedback}>{feedback}</p>}{quizComplete && pipeline && <p className={styles.paragraph}>Final score: {quizScore} / {pipeline.quiz.questions.length}</p>}</div></article>}
      </div>
    </section>
  </main></div>;
}
