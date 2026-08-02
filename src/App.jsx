import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useRoomSession } from "./hooks/useRoomSession";
import { useRoom } from "./hooks/useRoom";
import { computeScores, pointsForQuestion } from "./lib/quizLogic";
import {
  createRoom,
  findRoomByCode,
  joinRoom,
  startQuiz,
  revealAnswer,
  nextQuestion,
  restartRoom,
  updateBlur,
  setSoundPlaying,
  submitAnswer,
} from "./lib/roomActions";
import { Header } from "./components/Header";
import { StartScreen } from "./screens/StartScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { HostView } from "./screens/HostView";
import { PlayerView } from "./screens/PlayerView";
import { EndScreen } from "./screens/EndScreen";
import { ManageScreen } from "./screens/ManageScreen";
import { C } from "./theme/colors";

export default function App() {
  const [session, setSession] = useRoomSession();
  const { room, players, questions, answersByQuestion, loading, error: roomError } = useRoom(
    session?.roomId ?? null
  );

  const [area, setArea] = useState("play"); // 'play' | 'manage' (nur relevant außerhalb eines Raums)
  const [quizzes, setQuizzes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [estimateInput, setEstimateInput] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState(undefined);

  // Quiz-Liste laden, wenn wir zur Start-Ansicht wechseln (auch nach dem
  // Anlegen neuer Quizze im Verwaltungsbereich).
  useEffect(() => {
    if (session || area !== "play") return;
    supabase
      .from("quizzes")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (!error) setQuizzes(data || []);
      });
  }, [session, area]);

  // Lokale Eingaben zurücksetzen, sobald eine neue Frage dran ist.
  useEffect(() => {
    setEstimateInput("");
    setPendingAnswer(undefined);
  }, [room?.current_question_index]);

  // Gespeicherter Raum existiert nicht mehr (z.B. gelöscht) -> zurück zum Start.
  useEffect(() => {
    if (session && !loading && roomError) {
      setSession(null);
    }
  }, [session, loading, roomError, setSession]);

  async function handleCreateRoom(quizId) {
    setBusy(true);
    setActionError("");
    try {
      const newRoom = await createRoom(quizId);
      setSession({ roomId: newRoom.id, code: newRoom.code, role: "host" });
    } catch (err) {
      setActionError("Raum konnte nicht erstellt werden: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom(code, name) {
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
      const player = await joinRoom(foundRoom.id, name);
      setSession({
        roomId: foundRoom.id,
        code: foundRoom.code,
        role: "player",
        playerId: player.id,
        playerName: player.name,
      });
    } catch (err) {
      if (err.code === "23505") {
        setActionError("Dieser Name ist in diesem Raum schon vergeben.");
      } else {
        setActionError("Beitreten fehlgeschlagen: " + err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    setSession(null);
    setActionError("");
  }

  async function handleSubmitAnswer(value) {
    setPendingAnswer(value);
    try {
      await submitAnswer(room.id, question.id, session.playerId, value);
    } catch (err) {
      setPendingAnswer(undefined);
      console.error("Antwort konnte nicht gespeichert werden:", err);
    }
  }

  const isHost = session?.role === "host";
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

  let content;

  if (!session && area === "manage") {
    content = <ManageScreen />;
  } else if (!session) {
    content = (
      <StartScreen
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
        youId={session.playerId}
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
        onNext={() => nextQuestion(room.id, room.quiz_id, currentIndex + 1, currentIndex + 1 >= questions.length)}
      />
    );
  } else {
    const myAnswer = qAnswers[session.playerId] ?? pendingAnswer;
    content = (
      <PlayerView
        question={question}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        myAnswer={myAnswer}
        revealed={revealed}
        myPoints={lastPts[session.playerId] || 0}
        myScore={scores[session.playerId] || 0}
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
          code={session?.code}
          onLeave={session ? handleLeave : undefined}
          area={!session ? area : undefined}
          onAreaChange={!session ? setArea : undefined}
        />
        {content}
      </div>
    </div>
  );
}
