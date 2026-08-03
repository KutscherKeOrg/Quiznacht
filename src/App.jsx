import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./hooks/useAuth";
import { useRoomSession } from "./hooks/useRoomSession";
import { useRoom } from "./hooks/useRoom";
import { computeScores, pointsForQuestion, rankResults } from "./lib/quizLogic";
import { signOut } from "./lib/authActions";
import {
  createRoom,
  findRoomByCode,
  joinRoom,
  startQuiz,
  revealAnswer,
  nextQuestion,
  finishRoom,
  restartRoom,
  updateBlur,
  setSoundPlaying,
  submitAnswer,
} from "./lib/roomActions";
import { Header } from "./components/Header";
import { AuthScreen } from "./screens/AuthScreen";
import { StartScreen } from "./screens/StartScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { HostView } from "./screens/HostView";
import { PlayerView } from "./screens/PlayerView";
import { EndScreen } from "./screens/EndScreen";
import { ManageScreen } from "./screens/ManageScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { C } from "./theme/colors";

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const [roomSession, setRoomSession] = useRoomSession();
  const { room, players, questions, answersByQuestion, loading, error: roomError } = useRoom(
    roomSession?.roomId ?? null
  );

  const [area, setArea] = useState("play"); // 'play' | 'manage' | 'stats' (nur relevant außerhalb eines Raums)
  const [quizzes, setQuizzes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [estimateInput, setEstimateInput] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState(undefined);

  // Quiz-Liste laden, wenn wir zur Start-Ansicht wechseln (auch nach dem
  // Anlegen neuer Quizze im Verwaltungsbereich, oder sobald der Login
  // abgeschlossen ist).
  useEffect(() => {
    if (!user || roomSession || area !== "play") return;
    supabase
      .from("quizzes")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (!error) setQuizzes(data || []);
      });
  }, [user, roomSession, area]);

  // Lokale Eingaben zurücksetzen, sobald eine neue Frage dran ist.
  useEffect(() => {
    setEstimateInput("");
    setPendingAnswer(undefined);
  }, [room?.current_question_index]);

  // Gespeicherter Raum existiert nicht mehr (z.B. gelöscht) -> zurück zum Start.
  useEffect(() => {
    if (roomSession && !loading && roomError) {
      setRoomSession(null);
    }
  }, [roomSession, loading, roomError, setRoomSession]);

  async function handleCreateRoom(quizId) {
    setBusy(true);
    setActionError("");
    try {
      const newRoom = await createRoom(quizId);
      setRoomSession({ roomId: newRoom.id, code: newRoom.code, role: "host" });
    } catch (err) {
      setActionError("Raum konnte nicht erstellt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom(code) {
    setBusy(true);
    setActionError("");
    try {
      const foundRoom = await findRoomByCode(code);
      if (!foundRoom) {
        setActionError("Kein Raum mit diesem Code gefunden.");
        return;
      }
      if (foundRoom.phase !== "lobby") {
        setActionError("Dieser Raum hat schon gestartet – frag den Host nach einem neuen Code.");
        return;
      }
      const player = await joinRoom(foundRoom.id, profile.id, profile.display_name);
      setRoomSession({
        roomId: foundRoom.id,
        code: foundRoom.code,
        role: "player",
        playerId: player.id,
        playerName: player.name,
      });
    } catch (err) {
      if (err.code === "23505") {
        setActionError("Du bist diesem Raum schon beigetreten.");
      } else {
        setActionError("Beitreten fehlgeschlagen: " + err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    setRoomSession(null);
    setActionError("");
  }

  async function handleSubmitAnswer(value) {
    setPendingAnswer(value);
    const elapsedMs = room.question_started_at
      ? Date.now() - new Date(room.question_started_at).getTime()
      : null;
    try {
      await submitAnswer(room.id, question.id, roomSession.playerId, value, elapsedMs);
    } catch (err) {
      setPendingAnswer(undefined);
      console.error("Antwort konnte nicht gespeichert werden:", err);
    }
  }

  const isHost = roomSession?.role === "host";
  const currentIndex = room?.current_question_index ?? 0;
  const question = questions[currentIndex];
  const qAnswers = question ? answersByQuestion[question.id] || {} : {};
  const revealed = room?.revealed ?? false;

  const scores = useMemo(() => {
    if (!room) return {};
    return computeScores({ questions, answersByQuestion, players, currentIndex, revealed, phase: room.phase });
  }, [room, questions, answersByQuestion, players, currentIndex, revealed]);

  const lastPts = useMemo(() => {
    if (!question || !(revealed || room?.phase === "end")) return {};
    return pointsForQuestion(
      question,
      qAnswers,
      players.map((p) => p.id)
    );
  }, [question, revealed, room?.phase, qAnswers, players]);

  async function handleNext() {
    const isLast = currentIndex + 1 >= questions.length;
    if (!isLast) {
      await nextQuestion(room.id, currentIndex + 1);
      return;
    }
    const results = rankResults(
      players.map((p) => ({ profileId: p.profile_id, playerName: p.name, score: scores[p.id] || 0 }))
    );
    await finishRoom(room.id, room.quiz_id, results);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: C.bg }}>
        <p style={{ color: C.dim }}>Lade…</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen w-full px-4 py-6 md:px-8" style={{ background: C.bg, fontFamily: "var(--font-body)" }}>
        <AuthScreen />
      </div>
    );
  }

  let content;

  if (!roomSession && area === "manage") {
    content = <ManageScreen />;
  } else if (!roomSession && area === "stats") {
    content = <StatsScreen />;
  } else if (!roomSession) {
    content = (
      <StartScreen
        displayName={profile.display_name}
        quizzes={quizzes}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        busy={busy}
        errorMessage={actionError}
      />
    );
  } else if (loading || !room) {
    content = (
      <p className="text-center py-20" style={{ color: C.dim }}>
        Verbinde mit Raum…
      </p>
    );
  } else if (room.phase === "lobby") {
    content = (
      <LobbyScreen
        code={room.code}
        quizTitle={room.quiz?.title}
        players={players}
        isHost={isHost}
        canStart={players.length > 0 && questions.length > 0}
        onStart={() => startQuiz(room.id)}
      />
    );
  } else if (room.phase === "end") {
    content = (
      <EndScreen
        players={players}
        scores={scores}
        youId={roomSession.playerId}
        isHost={isHost}
        onRestart={() => restartRoom(room.id)}
      />
    );
  } else if (!question) {
    content = (
      <p className="text-center py-20" style={{ color: C.dim }}>
        Lade Frage…
      </p>
    );
  } else if (isHost) {
    content = (
      <HostView
        question={question}
        questions={questions}
        currentIndex={currentIndex}
        players={players}
        qAnswers={qAnswers}
        revealed={revealed}
        lastPts={lastPts}
        scores={scores}
        blur={room.blur}
        onRevealBlurStep={() => updateBlur(room.id, Math.max(0, room.blur - 5))}
        soundPlaying={room.sound_playing}
        onToggleSound={() => setSoundPlaying(room.id, !room.sound_playing)}
        onReveal={() => revealAnswer(room.id)}
        onNext={handleNext}
      />
    );
  } else {
    const myAnswer = qAnswers[roomSession.playerId] ?? pendingAnswer;
    content = (
      <PlayerView
        question={question}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        myAnswer={myAnswer}
        revealed={revealed}
        myPoints={lastPts[roomSession.playerId] || 0}
        myScore={scores[roomSession.playerId] || 0}
        blur={room.blur}
        soundPlaying={room.sound_playing}
        estimateInput={estimateInput}
        onEstimateInputChange={setEstimateInput}
        onSubmit={handleSubmitAnswer}
      />
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 md:px-8" style={{ background: C.bg, fontFamily: "var(--font-body)" }}>
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        <Header
          code={roomSession?.code}
          onLeave={roomSession ? handleLeave : undefined}
          area={!roomSession ? area : undefined}
          onAreaChange={!roomSession ? setArea : undefined}
          displayName={!roomSession ? profile.display_name : undefined}
          onSignOut={signOut}
        />
        {content}
      </div>
    </div>
  );
}
